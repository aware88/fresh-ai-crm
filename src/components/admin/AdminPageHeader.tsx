import React from 'react';
import Link from 'next/link';

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  backLink?: string;
  backLinkText?: string;
  actions?: React.ReactNode;
}

export const AdminPageHeader: React.FC<AdminPageHeaderProps> = ({
  title,
  description,
  backLink,
  backLinkText = 'Back',
  actions,
}) => {
  return (
    <div className="mb-6 space-y-4">
      {backLink && (
        <div className="mb-2">
          <Link 
            href={backLink}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            {backLinkText}
          </Link>
        </div>
      )}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center space-x-4">{actions}</div>}
      </div>
    </div>
  );
};

export default AdminPageHeader;
