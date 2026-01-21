// TypeScript interfaces for the application

export interface PRFile {
    filename: string;
    additions: number;
    deletions: number;
    patch?: string;
    status: string;
    changes: number;
}

export interface PRData {
    files: PRFile[];
    owner: string;
    repo: string;
    pull_number: string;
}

export interface GenerateDocsRequest {
    owner: string;
    repo: string;
    prNumber: string;
    diffData: { filename: string; patch?: string }[];
}

export interface GenerateDocsResponse {
    message: string;
    path: string;
    content: string;
}

export interface APIError {
    error: string;
}
