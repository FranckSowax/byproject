"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { 
  Bot, 
  ArrowRight, 
  Sparkles, 
  Plane, 
  Building2, 
  Users, 
  CheckCircle2, 
  Loader2,
  Send
} from 'lucide-react';

interface Question {
  id: number;
  text: string;
  answer: string;
}

export default function NewDelegationPage() {
  const router = useRouter();
  const supabase = createClient();
  
  // États du workflow
  const [step, setStep] = useState<'pitch' | 'analysis' | 'questions' | 'proposal'>('pitch');
  const [loading, setLoading] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  
  // Données
  const [missionPitch, setMissionPitch] = useState('');
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // 1. Soumettre le pitch pour analyse IA
  const handleAnalyzePitch = async () => {
    if (!missionPitch.trim()) {
      toast.error("Veuillez décrire votre mission");
      return;
    }

    setStep('analysis');
    setLoading(true);

    try {
      const response = await fetch('/api/ai/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ missionDescription: missionPitch }),
      });

      if (!response.ok) throw new Error('Erreur analyse IA');

      const data = await response.json();
      
      // Mapper les questions reçues
      const questions = data.questions.map((q: string, index: number) => ({
        id: index,
        text: q,
        answer: ''
      }));

      setGeneratedQuestions(questions);
      
      // Simuler un temps d'analyse pour l'effet UX "Immersion"
      setTimeout(() => {
        setStep('questions');
        setLoading(false);
      }, 1500);

    } catch (error) {
      console.error(error);
      toast.error("Impossible de générer l'analyse. Veuillez réessayer.");
      setStep('pitch');
      setLoading(false);
    }
  };

  // Fonction d'amélioration par IA
  const handleEnhanceAnswer = async () => {
    const currentQuestion = generatedQuestions[currentQuestionIndex];
    if (!currentQuestion.answer.trim()) {
      toast.warning("Veuillez d'abord rédiger un brouillon de réponse");
      return;
    }

    setIsEnhancing(true);
    try {
      const response = await fetch('/api/ai/enhance-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQuestion.text,
          answer: currentQuestion.answer,
          context: missionPitch
        }),
      });

      if (!response.ok) throw new Error('Erreur enhancement');

      const data = await response.json();
      
      // Mettre à jour la réponse avec le texte amélioré
      handleAnswerChange(data.enhancedAnswer);
      toast.success("Réponse améliorée avec succès !");
    } catch (error) {
      console.error('Error enhancing answer:', error);
      toast.error("Impossible d'améliorer la réponse pour le moment");
    } finally {
      setIsEnhancing(false);
    }
  };

  // 2. Gérer les réponses aux questions générées
  const handleAnswerChange = (value: string) => {
    const newQuestions = [...generatedQuestions];
    newQuestions[currentQuestionIndex].answer = value;
    setGeneratedQuestions(newQuestions);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < generatedQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleSubmitComplete();
    }
  };

  // 3. Finalisation
  const handleSubmitComplete = async () => {
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Vous devez être connecté pour créer une mission");
        router.push('/auth/login?next=/delegations/new');
        return;
      }

      // Préparer les données de contexte IA
      const aiContextData = {
        pitch: missionPitch,
        qa: generatedQuestions.map(q => ({
          question: q.text,
          answer: q.answer
        }))
      };

      // Sauvegarder dans Supabase
      const { data: mission, error } = await supabase
        .from('missions' as any)
        .insert({
          user_id: user.id,
          title: missionPitch.length > 50 ? missionPitch.substring(0, 50) + '...' : missionPitch,
          description: missionPitch,
          status: 'analyzing',
          ai_context_data: aiContextData
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Mission créée avec succès !", {
        description: "Notre IA génère votre proposition sur mesure..."
      });
      
      // Redirection vers la future page de proposition (on utilisera l'ID de la mission)
      // router.push(`/delegations/proposal/${mission.id}`);
      
      // Pour l'instant, retour au dashboard avec un message
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);

    } catch (error: any) {
      console.error('Error creating mission:', error);
      toast.error("Erreur lors de la création de la mission", {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  // Rendu de l'étape 1 : Le Pitch
  if (step === 'pitch') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900 text-white flex items-center justify-center p-4">
        <div className="max-w-2xl w-full space-y-8">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-blue-600/20 backdrop-blur-xl border border-blue-500/30 mb-4 shadow-[0_0_50px_-12px_rgba(37,99,235,0.5)]">
              <Plane className="h-10 w-10 text-blue-400" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-white via-blue-100 to-blue-400 bg-clip-text text-transparent">
              Nouvelle Mission
            </h1>
            <p className="text-lg text-slate-400 max-w-lg mx-auto">
              Délégations officielles & Grands Projets. <br/>
              Décrivez votre objectif, notre IA structure votre logistique.
            </p>
          </div>

          <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
            <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="pitch" className="text-lg font-medium text-blue-200">
                  Quel est l'objet de votre mission ?
                </Label>
                <Textarea
                  id="pitch"
                  placeholder="Ex: Délégation de 12 personnes pour la validation finale des équipements de l'Hôpital Régional de..."
                  className="min-h-[150px] bg-slate-950/50 border-blue-500/20 text-lg text-white placeholder:text-slate-600 focus:border-blue-500 transition-all resize-none"
                  value={missionPitch}
                  onChange={(e) => setMissionPitch(e.target.value)}
                />
              </div>

              <Button 
                onClick={handleAnalyzePitch}
                className="w-full h-14 text-lg bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/25 transition-all duration-300 group"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <Sparkles className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                )}
                Initialiser l'Immersion
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Rendu de l'étape 2 : Analyse (Transition)
  if (step === 'analysis') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
        <div className="relative w-32 h-32 mb-8">
          <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full animate-pulse" />
          <div className="absolute inset-0 border-t-4 border-blue-500 rounded-full animate-spin" />
          <Bot className="absolute inset-0 m-auto h-12 w-12 text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold mb-2 animate-pulse">Analyse Stratégique en cours...</h2>
        <p className="text-slate-400">Notre IA génère le profil de votre délégation</p>
      </div>
    );
  }

  // Rendu de l'étape 3 : Questions Dynamiques
  if (step === 'questions') {
    const question = generatedQuestions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / generatedQuestions.length) * 100;

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Progress Bar Top */}
        <div className="h-2 bg-slate-200 w-full">
          <div 
            className="h-full bg-blue-600 transition-all duration-500 ease-out" 
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex-1 flex items-center justify-center p-4 md:p-8">
          <div className="max-w-3xl w-full space-y-8">
            <div className="flex items-center justify-between text-sm font-medium text-slate-500 uppercase tracking-wider">
              <span>Question {currentQuestionIndex + 1} / {generatedQuestions.length}</span>
              <span>Immersion Phase</span>
            </div>

            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
                {question.text}
              </h2>

              <div className="relative">
                <Textarea
                  autoFocus
                  value={question.answer}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  placeholder="Votre réponse détaillée..."
                  className="min-h-[120px] text-xl p-6 bg-white border-2 border-slate-100 shadow-sm focus:border-blue-500 focus:ring-0 transition-all resize-none rounded-2xl"
                />
                <div className="absolute bottom-4 right-4">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-blue-600 hover:bg-blue-50"
                    onClick={handleEnhanceAnswer}
                    disabled={isEnhancing || !question.answer.trim()}
                  >
                    {isEnhancing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    Améliorer via IA
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <Button
                  variant="ghost"
                  onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentQuestionIndex === 0}
                  className="text-slate-400 hover:text-slate-600"
                >
                  Précédent
                </Button>

                <Button 
                  onClick={handleNextQuestion}
                  disabled={!question.answer.trim()}
                  className="h-12 px-8 bg-slate-900 hover:bg-black text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  {currentQuestionIndex === generatedQuestions.length - 1 ? 'Terminer l\'analyse' : 'Suivant'}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
