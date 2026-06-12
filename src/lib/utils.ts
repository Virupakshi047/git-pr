import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function truncateDiffData(
    diffData: { filename: string; patch?: string }[],
    maxFiles = 20,
    maxLinesPerFile = 100
): { filename: string; patch?: string }[] {
    return diffData.slice(0, maxFiles).map((file) => {
        if (!file.patch) return file;
        const lines = file.patch.split('\n');
        if (lines.length <= maxLinesPerFile) return file;
        return {
            ...file,
            patch: lines.slice(0, maxLinesPerFile).join('\n') +
                `\n... [${lines.length - maxLinesPerFile} more lines]`,
        };
    });
}
