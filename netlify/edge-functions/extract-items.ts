import { Config, Context } from "@netlify/edge-functions";

export default async function handler(request: Request, context: Context) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { projectId, fileContent, fileName, sectorName, customSectorName } = await request.json();

    if (!projectId || !fileContent) {
      return Response.json({ error: "Missing data" }, { status: 400 });
    }

    const sector = customSectorName || sectorName || "général";
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    
    if (!openaiKey) {
      return Response.json({ error: "OPENAI_API_KEY not configured" }, { status: 500 });
    }

    // Limiter le contenu pour éviter le timeout (max 8000 chars)
    const truncatedContent = fileContent.substring(0, 8000);
    console.log(`📝 Processing ${truncatedContent.length} chars for sector: ${sector}`);

    // Appel OpenAI avec timeout court
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s max

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Expert extraction BTP. JSON uniquement: {"items":[{"name":"X","category":"Y","quantity":1,"unit":"u"}],"categories":["Y"]}`
          },
          {
            role: "user",
            content: `Extrais les matériaux:\n${truncatedContent}`
          }
        ],
        temperature: 0,
        max_tokens: 4000,
        response_format: { type: "json_object" }
      }),
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenAI error:", error);
      return Response.json({ error: "OpenAI API error" }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    
    let result;
    try {
      result = JSON.parse(content);
    } catch {
      result = { items: [], categories: [] };
    }

    const items = result.items || [];
    const categories = result.categories || [];

    // Sauvegarder en base via Supabase
    const supabaseUrl = Deno.env.get("NEXT_PUBLIC_SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (supabaseUrl && supabaseKey && items.length > 0) {
      const materialsToInsert = items.map((item: any) => ({
        project_id: projectId,
        name: item.name,
        description: item.description || null,
        category: item.category || "Non catégorisé",
        quantity: item.quantity || null,
        specs: {
          ...item.specs,
          unit: item.unit,
          extracted_by: "gpt-4o-mini-edge",
          sector,
        },
      }));

      await fetch(`${supabaseUrl}/rest/v1/materials`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Prefer": "return=minimal",
        },
        body: JSON.stringify(materialsToInsert),
      });

      // Update project status
      await fetch(`${supabaseUrl}/rest/v1/projects?id=eq.${projectId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ mapping_status: "completed" }),
      });
    }

    return Response.json({
      success: true,
      model: "gpt-4o-mini-edge",
      sector,
      items,
      categories,
      statistics: {
        totalItems: items.length,
        itemsWithQuantity: items.filter((i: any) => i.quantity !== null).length,
        categoriesCount: categories.length,
      },
    });

  } catch (error) {
    console.error("Edge function error:", error);
    return Response.json({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}

export const config: Config = {
  path: "/api/edge/extract-items",
};
