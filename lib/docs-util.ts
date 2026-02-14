import fs from "fs";
import path from "path";

const docsDirectory = path.join(process.cwd(), "app/docs/content");

export interface DocArticle {
    slug: string;
    title: string;
    category: string;
    order: number;
    videoUrl?: string;
    content: string;
}

function parseFrontMatter(fileContent: string) {
    const frontmatterRegex = /---\s*([\s\S]*?)\s*---/;
    const match = frontmatterRegex.exec(fileContent);

    if (!match) {
        return {
            data: {},
            content: fileContent
        };
    }

    const frontMatterBlock = match[1];
    const content = fileContent.replace(match[0], '').trim();
    const data: Record<string, any> = {};

    frontMatterBlock.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split(':');
        if (key && valueParts.length > 0) {
            let value = valueParts.join(':').trim();
            // Handle basic types
            if (value === 'true') value = true as any;
            else if (value === 'false') value = false as any;
            else if (!isNaN(Number(value))) value = Number(value) as any;

            data[key.trim()] = value;
        }
    });

    return { data, content };
}

export function getAllDocs(): DocArticle[] {
    // Ensure directory exists
    if (!fs.existsSync(docsDirectory)) {
        return [];
    }

    const fileNames = fs.readdirSync(docsDirectory);
    const allDocsData = fileNames.filter(fileName => fileName.endsWith('.md')).map((fileName) => {
        // Remove ".md" from file name to get id
        const slug = fileName.replace(/\.md$/, "");

        // Read markdown file as string
        const fullPath = path.join(docsDirectory, fileName);
        const fileContents = fs.readFileSync(fullPath, "utf8");

        // Parse frontmatter manually
        const { data, content } = parseFrontMatter(fileContents);

        // Required frontmatter
        const title = data.title || "Untitled";
        const category = data.category || "Uncategorized";
        const order = data.order || 999;

        // Combine the data with the id
        return {
            slug,
            title,
            category,
            order,
            videoUrl: data.videoUrl,
            content,
        };
    });

    // Sort posts by order
    return allDocsData.sort((a, b) => {
        if (a.order < b.order) {
            return -1;
        } else {
            return 1;
        }
    });
}

export function getDocBySlug(slug: string): DocArticle | null {
    const fullPath = path.join(docsDirectory, `${slug}.md`);

    if (!fs.existsSync(fullPath)) {
        return null;
    }

    const fileContents = fs.readFileSync(fullPath, "utf8");
    const { data, content } = parseFrontMatter(fileContents);

    return {
        slug,
        title: data.title || "Untitled",
        category: data.category || "Uncategorized",
        order: data.order || 999,
        videoUrl: data.videoUrl,
        content,
    };
}
