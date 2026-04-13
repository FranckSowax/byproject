'use client';

import { Badge } from '@/components/ui/badge';
import {
  Clock,
  Send,
  Search,
  CheckCircle,
  Eye,
  FileText,
  ThumbsUp,
  ThumbsDown,
  XCircle,
} from 'lucide-react';
import type { ClientRequestStatus } from '@/lib/types/marketplace';

const statusConfig: Record<ClientRequestStatus, {
  label: string;
  color: string;
  icon: React.ElementType;
}> = {
  draft: {
    label: 'Brouillon',
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: Clock,
  },
  submitted: {
    label: 'Soumise',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: Send,
  },
  searching: {
    label: 'Recherche en cours',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    icon: Search,
  },
  search_complete: {
    label: 'Recherche terminée',
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    icon: CheckCircle,
  },
  proposal_ready: {
    label: 'Proposition envoyée',
    color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    icon: FileText,
  },
  proposal_reviewed: {
    label: 'Client a répondu',
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    icon: Eye,
  },
  quoted: {
    label: 'Devis généré',
    color: 'bg-teal-100 text-teal-700 border-teal-200',
    icon: FileText,
  },
  accepted: {
    label: 'Acceptée',
    color: 'bg-green-100 text-green-700 border-green-200',
    icon: ThumbsUp,
  },
  rejected: {
    label: 'Refusée',
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: ThumbsDown,
  },
  cancelled: {
    label: 'Annulée',
    color: 'bg-gray-100 text-gray-500 border-gray-200',
    icon: XCircle,
  },
};

export function RequestStatusBadge({ status }: { status: ClientRequestStatus }) {
  const config = statusConfig[status] || statusConfig.draft;
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`${config.color} gap-1`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
