import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, User, Calendar } from 'lucide-react';
import { formatCommentDate, TranslatedMaterialComment } from '@/lib/comments';

interface CommentsCardProps {
  comments: TranslatedMaterialComment[];
  language?: 'fr' | 'en' | 'zh';
  translations: {
    title: string;
    noComments: string;
  };
}

export function CommentsCard({ comments, language = 'fr', translations }: CommentsCardProps) {
  if (!comments || comments.length === 0) {
    return null;
  }

  const locale = language === 'zh' ? 'zh-CN' : language === 'en' ? 'en-US' : 'fr-FR';

  return (
    <Card className="mt-4 bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 text-purple-700">
          <MessageSquare className="h-5 w-5" />
          {translations.title} ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {comments.map((comment, idx) => (
          <div 
            key={comment.id || idx} 
            className="bg-white p-4 rounded-lg shadow-sm border border-purple-100 hover:shadow-md transition-shadow"
          >
            {/* User info */}
            <div className="flex items-center gap-3 mb-2 pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2 flex-1">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">
                    {comment.user_name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {comment.user_email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Calendar className="h-3 w-3" />
                <span>{formatCommentDate(comment.created_at, locale)}</span>
              </div>
            </div>

            {/* Comment text */}
            <div className="text-sm text-gray-700 leading-relaxed">
              {comment.translatedComment || comment.comment}
            </div>

            {/* Show original if translated */}
            {comment.translatedComment && comment.translatedComment !== comment.comment && (
              <details className="mt-2">
                <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                  {language === 'en' ? 'Original (French)' : language === 'zh' ? '原文 (法语)' : 'Original'}
                </summary>
                <p className="text-xs text-gray-600 mt-1 italic pl-4 border-l-2 border-gray-200">
                  {comment.comment}
                </p>
              </details>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
