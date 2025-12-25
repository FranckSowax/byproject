"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Loader2,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  FileText,
  Package,
  Truck,
  Shield,
  DollarSign,
  Calendar,
  HelpCircle
} from 'lucide-react';

// Types
interface FormFieldOption {
  value: string;
  label: string;
}

interface FormField {
  id: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'date' | 'file' | 'checkbox' | 'radio';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: FormFieldOption[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
  helpText?: string;
  category: string;
}

interface FormSection {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
}

interface GeneratedForm {
  formTitle: string;
  formDescription: string;
  sections: FormSection[];
  suggestedMaterials?: string[];
}

interface DynamicMissionFormProps {
  missionContext: string;
  sector?: string;
  country?: string;
  teamSize?: string;
  objectives?: string;
  onSubmit: (formData: Record<string, any>, suggestedMaterials: string[]) => void;
  onCancel?: () => void;
}

export default function DynamicMissionForm({
  missionContext,
  sector,
  country,
  teamSize,
  objectives,
  onSubmit,
  onCancel
}: DynamicMissionFormProps) {
  const [loading, setLoading] = useState(false);
  const [generatedForm, setGeneratedForm] = useState<GeneratedForm | null>(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Générer le formulaire via l'API
  const generateForm = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/generate-mission-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          missionContext,
          sector,
          country,
          teamSize,
          objectives
        }),
      });

      if (!response.ok) throw new Error('Erreur lors de la génération');

      const data = await response.json();
      setGeneratedForm(data.form);
      toast.success("Formulaire généré avec succès !", {
        description: `${data.form.sections?.length || 0} sections créées`
      });
    } catch (error: any) {
      console.error('Error generating form:', error);
      toast.error("Impossible de générer le formulaire");
    } finally {
      setLoading(false);
    }
  };

  // Gérer les changements de valeur
  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    // Effacer l'erreur si elle existe
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  // Valider la section courante
  const validateCurrentSection = (): boolean => {
    if (!generatedForm) return false;
    
    const currentSection = generatedForm.sections[currentSectionIndex];
    const newErrors: Record<string, string> = {};

    currentSection.fields.forEach(field => {
      if (field.required && !formData[field.id]) {
        newErrors[field.id] = 'Ce champ est requis';
      }
      if (field.validation) {
        const value = formData[field.id];
        if (field.validation.min !== undefined && Number(value) < field.validation.min) {
          newErrors[field.id] = `Minimum: ${field.validation.min}`;
        }
        if (field.validation.max !== undefined && Number(value) > field.validation.max) {
          newErrors[field.id] = `Maximum: ${field.validation.max}`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Navigation entre sections
  const handleNext = () => {
    if (!validateCurrentSection()) {
      toast.error("Veuillez corriger les erreurs");
      return;
    }
    if (generatedForm && currentSectionIndex < generatedForm.sections.length - 1) {
      setCurrentSectionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(prev => prev - 1);
    }
  };

  // Soumettre le formulaire
  const handleSubmit = () => {
    if (!validateCurrentSection()) {
      toast.error("Veuillez corriger les erreurs");
      return;
    }
    onSubmit(formData, generatedForm?.suggestedMaterials || []);
  };

  // Icône de catégorie
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'general': return <FileText className="h-4 w-4" />;
      case 'technical': return <Package className="h-4 w-4" />;
      case 'logistics': return <Truck className="h-4 w-4" />;
      case 'quality': return <Shield className="h-4 w-4" />;
      case 'budget': return <DollarSign className="h-4 w-4" />;
      case 'timeline': return <Calendar className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  // Rendu d'un champ
  const renderField = (field: FormField) => {
    const error = errors[field.id];
    const value = formData[field.id] || '';

    const baseInputClass = cn(
      "w-full transition-all",
      error ? "border-red-300 focus:border-red-500 focus:ring-red-500/20" : "border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
    );

    return (
      <div key={field.id} className="space-y-2">
        <Label htmlFor={field.id} className="flex items-center gap-2 text-sm font-medium text-slate-700">
          {field.label}
          {field.required && <span className="text-red-500">*</span>}
          {field.helpText && (
            <span className="group relative">
              <HelpCircle className="h-3.5 w-3.5 text-slate-400 cursor-help" />
              <span className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-48 p-2 text-xs bg-slate-900 text-white rounded-lg shadow-lg z-10">
                {field.helpText}
              </span>
            </span>
          )}
        </Label>

        {field.type === 'text' && (
          <Input
            id={field.id}
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={baseInputClass}
          />
        )}

        {field.type === 'textarea' && (
          <Textarea
            id={field.id}
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={cn(baseInputClass, "min-h-[100px] resize-none")}
          />
        )}

        {field.type === 'number' && (
          <Input
            id={field.id}
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            min={field.validation?.min}
            max={field.validation?.max}
            className={baseInputClass}
          />
        )}

        {field.type === 'date' && (
          <Input
            id={field.id}
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className={baseInputClass}
          />
        )}

        {field.type === 'select' && (
          <select
            id={field.id}
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className={cn(baseInputClass, "h-10 rounded-md border bg-white px-3 py-2")}
          >
            <option value="">{field.placeholder || 'Sélectionner...'}</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}

        {field.type === 'checkbox' && (
          <div className="flex items-center gap-2">
            <input
              id={field.id}
              type="checkbox"
              checked={!!value}
              onChange={(e) => handleFieldChange(field.id, e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-slate-600">{field.placeholder}</span>
          </div>
        )}

        {field.type === 'radio' && field.options && (
          <div className="space-y-2">
            {field.options.map(option => (
              <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={field.id}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-600">{option.label}</span>
              </label>
            ))}
          </div>
        )}

        {error && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {error}
          </p>
        )}
      </div>
    );
  };

  // État initial : bouton pour générer
  if (!generatedForm && !loading) {
    return (
      <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50">
        <CardContent className="py-16 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 mb-6 shadow-lg">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            Formulaire Intelligent
          </h3>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">
            Notre IA va générer un formulaire personnalisé basé sur le contexte de votre mission 
            pour collecter toutes les informations nécessaires.
          </p>
          <Button 
            onClick={generateForm}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Générer le formulaire
          </Button>
        </CardContent>
      </Card>
    );
  }

  // État de chargement
  if (loading) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Génération en cours...
          </h3>
          <p className="text-slate-500">
            L'IA analyse votre contexte et crée un formulaire adapté
          </p>
        </CardContent>
      </Card>
    );
  }

  // Formulaire généré
  if (!generatedForm) return null;

  const currentSection = generatedForm.sections[currentSectionIndex];
  const isLastSection = currentSectionIndex === generatedForm.sections.length - 1;
  const progress = ((currentSectionIndex + 1) / generatedForm.sections.length) * 100;

  return (
    <div className="space-y-6">
      {/* Header avec progression */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">{generatedForm.formTitle}</CardTitle>
              <CardDescription>{generatedForm.formDescription}</CardDescription>
            </div>
            <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
              <Sparkles className="h-3 w-3 mr-1" />
              Généré par IA
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">
                Section {currentSectionIndex + 1} sur {generatedForm.sections.length}
              </span>
              <span className="font-medium text-blue-600">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Section tabs */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            {generatedForm.sections.map((section, index) => (
              <button
                key={section.id}
                onClick={() => setCurrentSectionIndex(index)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                  index === currentSectionIndex
                    ? "bg-blue-100 text-blue-700"
                    : index < currentSectionIndex
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
                )}
              >
                {index < currentSectionIndex ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-xs">
                    {index + 1}
                  </span>
                )}
                {section.title}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Section courante */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              {getCategoryIcon(currentSection.fields[0]?.category || 'general')}
            </div>
            <div>
              <CardTitle>{currentSection.title}</CardTitle>
              {currentSection.description && (
                <CardDescription>{currentSection.description}</CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {currentSection.fields.map(field => (
              <div key={field.id} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                {renderField(field)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Matériaux suggérés (si dernière section) */}
      {isLastSection && generatedForm.suggestedMaterials && generatedForm.suggestedMaterials.length > 0 && (
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardHeader>
            <CardTitle className="text-emerald-700 flex items-center gap-2">
              <Package className="h-5 w-5" />
              Matériaux suggérés par l'IA
            </CardTitle>
            <CardDescription>
              Basé sur votre contexte, ces matériaux pourraient être pertinents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {generatedForm.suggestedMaterials.map((material, index) => (
                <Badge key={index} variant="outline" className="bg-white border-emerald-200 text-emerald-700">
                  {material}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div>
          {onCancel && (
            <Button variant="ghost" onClick={onCancel}>
              Annuler
            </Button>
          )}
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentSectionIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Précédent
          </Button>
          {isLastSection ? (
            <Button 
              onClick={handleSubmit}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Valider le formulaire
            </Button>
          ) : (
            <Button onClick={handleNext}>
              Suivant
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
