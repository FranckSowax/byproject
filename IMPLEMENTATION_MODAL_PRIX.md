# 💰 Implémentation Modal Prix - Code Complet

## 📋 Fonctions à Ajouter

### 1. Charger les Prix d'un Matériau

```typescript
const loadPrices = async (materialId: string) => {
  try {
    setIsLoadingPrices(true);
    
    const { data, error } = await supabase
      .from('prices')
      .select(`
        *,
        supplier:suppliers(*)
      `)
      .eq('material_id', materialId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    setPrices(data || []);
  } catch (error) {
    console.error("Error loading prices:", error);
    toast.error("Erreur lors du chargement des prix");
  } finally {
    setIsLoadingPrices(false);
  }
};
```

### 2. Charger les Fournisseurs

```typescript
const loadSuppliers = async () => {
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    
    setSuppliers(data || []);
  } catch (error) {
    console.error("Error loading suppliers:", error);
  }
};
```

### 3. Ouvrir le Modal Prix

```typescript
const handleOpenPriceDialog = async (material: Material) => {
  setSelectedMaterial(material);
  setIsPriceDialogOpen(true);
  await loadPrices(material.id);
  await loadSuppliers();
};
```

### 4. Ajouter un Prix

```typescript
const handleAddPrice = async () => {
  if (!selectedMaterial || !newPrice.amount || !newPrice.country) {
    toast.error("Veuillez remplir tous les champs requis");
    return;
  }

  try {
    setIsSaving(true);

    let supplierId = null;

    // Créer un nouveau fournisseur si nécessaire
    if (selectedSupplier === 'new' && newPrice.supplier_name) {
      const { data: supplierData, error: supplierError } = await supabase
        .from('suppliers')
        .insert({
          name: newPrice.supplier_name,
          country: newPrice.country,
          contact_name: newPrice.contact_name,
          phone: newPrice.phone,
          whatsapp: newPrice.whatsapp,
          email: newPrice.email,
          wechat: newPrice.wechat,
        })
        .select()
        .single();

      if (supplierError) throw supplierError;
      supplierId = supplierData.id;
    } else if (selectedSupplier !== 'new') {
      supplierId = selectedSupplier;
    }

    // Calculer le montant converti en FCFA
    let convertedAmount = parseFloat(newPrice.amount);
    if (newPrice.currency !== 'FCFA') {
      const { data: rateData } = await supabase
        .from('exchange_rates')
        .select('rate')
        .eq('from_currency', newPrice.currency)
        .eq('to_currency', 'FCFA')
        .single();

      if (rateData) {
        convertedAmount = parseFloat(newPrice.amount) * rateData.rate;
      }
    }

    // Ajouter le prix
    const { error: priceError } = await supabase
      .from('prices')
      .insert({
        material_id: selectedMaterial.id,
        supplier_id: supplierId,
        country: newPrice.country,
        amount: parseFloat(newPrice.amount),
        currency: newPrice.currency,
        converted_amount: convertedAmount,
        notes: newPrice.notes,
      });

    if (priceError) throw priceError;

    toast.success("Prix ajouté avec succès");
    setIsAddPriceDialogOpen(false);
    
    // Réinitialiser le formulaire
    setNewPrice({
      country: '',
      supplier_name: '',
      contact_name: '',
      phone: '',
      whatsapp: '',
      email: '',
      wechat: '',
      amount: '',
      currency: 'FCFA',
      notes: '',
    });
    setSelectedSupplier('new');
    
    // Recharger les prix
    await loadPrices(selectedMaterial.id);
  } catch (error) {
    console.error("Error adding price:", error);
    toast.error("Erreur lors de l'ajout du prix");
  } finally {
    setIsSaving(false);
  }
};
```

### 5. Supprimer un Prix

```typescript
const handleDeletePrice = async (priceId: number) => {
  if (!confirm("Êtes-vous sûr de vouloir supprimer ce prix ?")) {
    return;
  }

  try {
    const { error } = await supabase
      .from('prices')
      .delete()
      .eq('id', priceId);

    if (error) throw error;

    toast.success("Prix supprimé");
    
    if (selectedMaterial) {
      await loadPrices(selectedMaterial.id);
    }
  } catch (error) {
    console.error("Error deleting price:", error);
    toast.error("Erreur lors de la suppression");
  }
};
```

---

## 🎨 Modal Prix - JSX

### Modal Principal "Gérer les Prix"

```tsx
{/* Modal Gérer les Prix */}
<Dialog open={isPriceDialogOpen} onOpenChange={setIsPriceDialogOpen}>
  <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <DollarSign className="h-5 w-5 text-green-600" />
        Prix - {selectedMaterial?.name}
      </DialogTitle>
      <DialogDescription>
        Gérez les prix de ce matériau par pays et fournisseur
      </DialogDescription>
    </DialogHeader>

    {isLoadingPrices ? (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    ) : prices.length > 0 ? (
      <div className="space-y-4">
        {/* Grouper par pays */}
        {Object.entries(
          prices.reduce((acc: any, price: any) => {
            if (!acc[price.country]) acc[price.country] = [];
            acc[price.country].push(price);
            return acc;
          }, {})
        ).map(([country, countryPrices]: [string, any]) => (
          <div key={country} className="space-y-2">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              {country === 'Cameroun' && '📍'}
              {country === 'Chine' && '🇨🇳'}
              {country}
            </h3>
            
            {countryPrices.map((price: any) => (
              <Card key={price.id} className="p-4">
                <div className="space-y-3">
                  {/* Fournisseur */}
                  {price.supplier && (
                    <div>
                      <p className="font-medium">{price.supplier.name}</p>
                      {price.supplier.contact_name && (
                        <p className="text-sm text-gray-600">
                          Contact: {price.supplier.contact_name}
                        </p>
                      )}
                      <div className="flex gap-3 mt-1 text-sm text-gray-600">
                        {price.supplier.phone && (
                          <span>📞 {price.supplier.phone}</span>
                        )}
                        {price.supplier.whatsapp && (
                          <span>💬 {price.supplier.whatsapp}</span>
                        )}
                        {price.supplier.wechat && (
                          <span>WeChat: {price.supplier.wechat}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Prix */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-green-600">
                      {price.amount.toLocaleString()} {price.currency}
                    </span>
                    {price.currency !== 'FCFA' && price.converted_amount && (
                      <span className="text-sm text-gray-600">
                        (≈ {Math.round(price.converted_amount).toLocaleString()} FCFA)
                      </span>
                    )}
                  </div>

                  {/* Économie si prix Chine */}
                  {country === 'Chine' && price.converted_amount && (
                    (() => {
                      const localPrice = prices.find(p => p.country === 'Cameroun');
                      if (localPrice && localPrice.converted_amount) {
                        const savings = localPrice.converted_amount - price.converted_amount;
                        const percentage = (savings / localPrice.converted_amount * 100).toFixed(0);
                        return savings > 0 ? (
                          <div className="text-sm font-medium text-green-600">
                            💰 Économie: {Math.round(savings).toLocaleString()} FCFA ({percentage}%)
                          </div>
                        ) : null;
                      }
                      return null;
                    })()
                  )}

                  {/* Notes */}
                  {price.notes && (
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm font-medium mb-1">📝 Notes:</p>
                      <p className="text-sm text-gray-700 whitespace-pre-line">
                        {price.notes}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeletePrice(price.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ))}
      </div>
    ) : (
      <div className="text-center py-8 text-gray-500">
        <DollarSign className="h-12 w-12 mx-auto mb-2 text-gray-400" />
        <p>Aucun prix ajouté pour ce matériau</p>
      </div>
    )}

    <DialogFooter className="flex justify-between">
      <Button
        onClick={() => setIsAddPriceDialogOpen(true)}
        className="bg-green-600 hover:bg-green-700"
      >
        <Plus className="mr-2 h-4 w-4" />
        Ajouter un Prix
      </Button>
      <Button variant="outline" onClick={() => setIsPriceDialogOpen(false)}>
        Fermer
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## 📝 Modal Ajout de Prix - JSX

```tsx
{/* Modal Ajouter un Prix */}
<Dialog open={isAddPriceDialogOpen} onOpenChange={setIsAddPriceDialogOpen}>
  <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>Ajouter un Prix</DialogTitle>
      <DialogDescription>
        Ajoutez un nouveau prix pour {selectedMaterial?.name}
      </DialogDescription>
    </DialogHeader>

    <div className="space-y-4">
      {/* Pays */}
      <div className="grid gap-2">
        <Label htmlFor="country">Pays *</Label>
        <select
          id="country"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
          value={newPrice.country}
          onChange={(e) => {
            setNewPrice({ ...newPrice, country: e.target.value });
            // Auto-sélectionner la devise selon le pays
            if (e.target.value === 'Chine') {
              setNewPrice({ ...newPrice, country: e.target.value, currency: 'CNY' });
            } else if (e.target.value === 'Cameroun') {
              setNewPrice({ ...newPrice, country: e.target.value, currency: 'FCFA' });
            }
          }}
        >
          <option value="">Sélectionner un pays</option>
          <option value="Cameroun">Cameroun</option>
          <option value="Chine">Chine</option>
          <option value="France">France</option>
          <option value="USA">USA</option>
        </select>
      </div>

      {/* Fournisseur */}
      <div className="space-y-3">
        <Label>Fournisseur *</Label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={selectedSupplier === 'new'}
              onChange={() => setSelectedSupplier('new')}
            />
            Nouveau fournisseur
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={selectedSupplier !== 'new'}
              onChange={() => setSelectedSupplier('')}
            />
            Fournisseur existant
          </label>
        </div>

        {selectedSupplier !== 'new' && (
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
            value={selectedSupplier}
            onChange={(e) => setSelectedSupplier(e.target.value)}
          >
            <option value="">Sélectionner un fournisseur</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name} ({supplier.country})
              </option>
            ))}
          </select>
        )}

        {selectedSupplier === 'new' && (
          <>
            <Input
              placeholder="Nom du fournisseur"
              value={newPrice.supplier_name}
              onChange={(e) => setNewPrice({ ...newPrice, supplier_name: e.target.value })}
            />
            <Input
              placeholder="Nom du contact"
              value={newPrice.contact_name}
              onChange={(e) => setNewPrice({ ...newPrice, contact_name: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Téléphone"
                value={newPrice.phone}
                onChange={(e) => setNewPrice({ ...newPrice, phone: e.target.value })}
              />
              <Input
                placeholder="WhatsApp"
                value={newPrice.whatsapp}
                onChange={(e) => setNewPrice({ ...newPrice, whatsapp: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Email"
                type="email"
                value={newPrice.email}
                onChange={(e) => setNewPrice({ ...newPrice, email: e.target.value })}
              />
              <Input
                placeholder="WeChat"
                value={newPrice.wechat}
                onChange={(e) => setNewPrice({ ...newPrice, wechat: e.target.value })}
              />
            </div>
          </>
        )}
      </div>

      {/* Prix */}
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="amount">Montant *</Label>
          <Input
            id="amount"
            type="number"
            placeholder="0"
            value={newPrice.amount}
            onChange={(e) => setNewPrice({ ...newPrice, amount: e.target.value })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="currency">Devise</Label>
          <select
            id="currency"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
            value={newPrice.currency}
            onChange={(e) => setNewPrice({ ...newPrice, currency: e.target.value })}
          >
            <option value="FCFA">FCFA (₣)</option>
            <option value="CNY">CNY (¥)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
          </select>
        </div>
      </div>

      {/* Notes */}
      <div className="grid gap-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          placeholder="MOQ, délais, conditions, etc."
          rows={4}
          value={newPrice.notes}
          onChange={(e) => setNewPrice({ ...newPrice, notes: e.target.value })}
        />
      </div>
    </div>

    <DialogFooter>
      <Button
        variant="outline"
        onClick={() => setIsAddPriceDialogOpen(false)}
        disabled={isSaving}
      >
        Annuler
      </Button>
      <Button
        onClick={handleAddPrice}
        disabled={isSaving || !newPrice.amount || !newPrice.country}
      >
        {isSaving ? "Ajout..." : "Ajouter"}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## ✅ Checklist Implémentation

### Phase 2: Modal Prix
- [ ] Ajouter les fonctions (loadPrices, loadSuppliers, etc.)
- [ ] Créer le modal principal
- [ ] Afficher les prix groupés par pays
- [ ] Afficher les infos fournisseur
- [ ] Calculer et afficher les économies
- [ ] Bouton supprimer prix

### Phase 3: Formulaire Ajout
- [ ] Modal d'ajout de prix
- [ ] Sélection pays
- [ ] Choix nouveau/existant fournisseur
- [ ] Formulaire fournisseur complet
- [ ] Champs prix et devise
- [ ] Conversion automatique
- [ ] Zone de notes
- [ ] Validation et sauvegarde

---

## 🚀 Prochaines Étapes

1. Copier les fonctions dans le fichier page.tsx
2. Ajouter les modals avant la fermeture du composant
3. Tester l'ajout de prix
4. Ajouter l'upload de photos (Phase 3.5)
5. Créer la page de comparaison (Phase 4)

---

**Code complet prêt à intégrer!** 🎉
