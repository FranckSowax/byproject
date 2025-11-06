import { ComingSoon } from '@/components/admin/ComingSoon';
import { Users } from 'lucide-react';

export default function UsersPage() {
  return (
    <ComingSoon
      title="Utilisateurs"
      description="Gestion des comptes utilisateurs"
      icon={Users}
    />
  );
}
