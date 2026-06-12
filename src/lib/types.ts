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
    prTitle: string;
    prLink: string;
}

export interface GenerateSummaryRequest {
    owner: string;
    repo: string;
    prNumber: string;
    diffData: { filename: string; patch?: string }[];
}

export interface APIError {
    error: string;
}
