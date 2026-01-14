"use client";

import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import {
  FaFacebook,
  FaXTwitter,
  FaLinkedin,
  FaInstagram,
  FaMedium,
  FaPatreon,
  FaDiscord,
  FaGithub,
  FaYoutube,
  FaGlobe,
  FaLink,
} from "react-icons/fa6";
import {
  Trash2,
  Plus,
  Copy,
  Save,
  Check,
  Upload,
  Image as ImageIcon,
  Palette,
  User as UserIcon,
  Share2,
  GripVertical
} from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ColorPicker } from "@/components/ui/color-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// --- Types ---

type SocialPlatform =
  | "linkedin"
  | "twitter"
  | "facebook"
  | "instagram"
  | "medium"
  | "patreon"
  | "discord"
  | "github"
  | "youtube"
  | "website"
  | "custom";

interface SocialLink {
  id: string;
  platform: SocialPlatform;
  url: string;
  active: boolean;
}

interface Medallion {
  id: string;
  imageUrl: string;
  linkUrl: string;
}

interface SignatureData {
  firstName: string;
  lastName: string;
  title: string;
  department: string;
  phone: string;
  email: string;
  website: string;
  profileImage: string;
  companyLogoUrl: string;
  companyTagline: string;
  accentColor: string;
  template: "professional" | "modern" | "minimalist" | "elegant" | "creative" | "banner" | "corporate" | "compact" | "tech" | "classic" | "social" | "dense";
  socialLinks: SocialLink[];
  textColor: string;
  backgroundColor: string;
  highlightLastName: boolean;
  transparentBackground: boolean;

  medallions: Medallion[];
  imageShape: "circle" | "rounded" | "oval";
}

interface SignatureBuilderProps {
  hasAccess: boolean;
}

// --- Constants ---

const DEFAULT_COLOR = "#F54029"; // TUC Red
const DEFAULT_TEXT_COLOR = "#334155";
const DEFAULT_BACKGROUND_COLOR = "#ffffff"; // Slate 900

const THEME_COLORS = [
  "#F54029", // TUC Red
  "#0ea5e9", // Sky Blue
  "#22c55e", // Green
  "#eab308", // Yellow
  "#f97316", // Orange
  "#ec4899", // Pink
  "#8b5cf6", // Violet
  "#14b8a6", // Teal
  "#64748b", // Slate
  "#000000", // Black
  "#1d4ed8", // Dark Blue
  "#be185d", // Dark Pink
  "#b45309", // Amber
];

const SOCIAL_PLATFORMS = [
  { id: "linkedin", label: "LinkedIn", icon: <FaLinkedin className="w-4 h-4" /> },
  { id: "twitter", label: "X / Twitter", icon: <FaXTwitter className="w-4 h-4" /> },
  { id: "facebook", label: "Facebook", icon: <FaFacebook className="w-4 h-4" /> },
  { id: "instagram", label: "Instagram", icon: <FaInstagram className="w-4 h-4" /> },
  { id: "medium", label: "Medium", icon: <FaMedium className="w-4 h-4" /> },
  { id: "youtube", label: "YouTube", icon: <FaYoutube className="w-4 h-4" /> },
  { id: "github", label: "GitHub", icon: <FaGithub className="w-4 h-4" /> },
  { id: "discord", label: "Discord", icon: <FaDiscord className="w-4 h-4" /> },
  { id: "patreon", label: "Patreon", icon: <FaPatreon className="w-4 h-4" /> },
  { id: "website", label: "Website", icon: <FaLink className="w-4 h-4" /> }
];

const DEFAULT_SOCIAL_LINKS: SocialLink[] = SOCIAL_PLATFORMS.map(p => ({
  id: p.id as SocialPlatform,
  platform: p.id as SocialPlatform,
  url: "",
  active: false
}));

const SOCIAL_BASE_URLS: Record<string, string> = {
  linkedin: "https://www.linkedin.com/in/",
  twitter: "https://x.com/",
  facebook: "https://www.facebook.com/",
  instagram: "https://www.instagram.com/",
  medium: "https://medium.com/@",
  patreon: "https://www.patreon.com/",
  discord: "https://discord.com/users/", // or invite link logic, but base for now
  github: "https://github.com/",
  youtube: "https://www.youtube.com/@",
  website: "https://", // special case
};

// --- Helper Functions ---

const generateId = () => Math.random().toString(36).substr(2, 9);

// Convert Hex to RGB for rgba CSS
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : "245, 64, 41";
};

const getIconUrl = (name: string, color: string) => {
  const hex = color.replace("#", "");
  // Map 'twitter' to 'twitterx' for Icons8 compatibility
  const iconName = name === 'twitter' ? 'twitterx' : name;
  return `https://img.icons8.com/ios-filled/50/${hex}/${iconName}.png`;
};

const ensureAbsoluteUrl = (url: string, platform?: string) => {
  if (!url) return "";
  const trimmed = url.trim();

  // If it already has a protocol, rely on it
  if (trimmed.match(/^(http:\/\/|https:\/\/|mailto:|tel:)/i)) {
    return trimmed;
  }

  // If it looks like a domain (has a dot and no spaces), treat as website/direct link needs https
  if (trimmed.includes(".") && !trimmed.includes(" ")) {
    return `https://${trimmed}`;
  }

  // If we have a platform context and it's not a URL, prepend the base URL
  if (platform && SOCIAL_BASE_URLS[platform]) {
    // Remove @ if user added it
    const cleanHandle = trimmed.replace(/^@/, "");
    // Special handling for website if it doesn't have a dot (unlikely but safe)
    if (platform === 'website') return `https://${cleanHandle}`;

    return `${SOCIAL_BASE_URLS[platform]}${cleanHandle}`;
  }

  // Fallback: assume it's a domain/link the user meant to be absolute
  return `https://${trimmed}`;
};

// --- Component ---

const SignatureBuilder: React.FC<SignatureBuilderProps> = ({ hasAccess }) => {
  // State
  const [data, setData] = useState<SignatureData>({
    firstName: "",
    lastName: "",
    title: "",
    department: "",
    phone: "",
    email: "",
    website: "theutilitycompany.co",
    profileImage: "",
    companyLogoUrl: "https://storage.googleapis.com/tgl_cdn/images/Medallions/TUC.png",
    companyTagline: "Simple Choices. Complex Outcomes.",
    accentColor: DEFAULT_COLOR,
    template: "professional",
    socialLinks: DEFAULT_SOCIAL_LINKS, // Initialize with default social links
    textColor: DEFAULT_TEXT_COLOR,
    backgroundColor: DEFAULT_BACKGROUND_COLOR,
    highlightLastName: true,
    transparentBackground: false,

    medallions: [],
    imageShape: "circle",
  });

  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("design");

  // Visibility configuration
  const VISIBLE_FIELDS: Record<string, string[]> = {
    professional: ["department", "companyLogoUrl", "companyTagline", "medallions"],
    modern: ["companyLogoUrl", "medallions"], // No department, no tagline
    minimalist: ["medallions"], // No logo, dept, tagline
    elegant: ["department", "medallions"], // No logo, tagline
    creative: ["medallions"], // No dept, logo, tagline
    banner: ["department", "companyLogoUrl", "companyTagline", "medallions"],
    corporate: ["department", "companyLogoUrl", "medallions"], // No tagline
    compact: ["medallions"], // No dept, logo, tagline
    tech: ["companyLogoUrl", "medallions"],
    classic: ["department", "medallions"],
    social: ["medallions"],
    dense: ["department", "companyLogoUrl", "medallions"],
  };

  const currentVisible = VISIBLE_FIELDS[data.template] || [];
  const isVisible = (field: string) =>
    ["firstName", "lastName", "title", "phone", "email", "website", "profileImage"].includes(field) ||
    currentVisible.includes(field);

  // Load saved data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/profile/signature", { method: "GET" });
        if (!res.ok) return;
        const json = await res.json();
        const meta = json?.signature_meta;
        if (meta && typeof meta === "object") {
          let socialLinks = meta.socialLinks;
          if (!Array.isArray(socialLinks) || socialLinks.length === 0) {
            // If no social links or old format, initialize with default structure
            socialLinks = DEFAULT_SOCIAL_LINKS.map(defaultLink => {
              const existing = meta.socialLinks?.find((l: SocialLink) => l.id === defaultLink.id);
              return existing ? { ...defaultLink, url: existing.url, active: existing.active } : defaultLink;
            });
          } else {
            // Ensure all default platforms are present, merging existing data
            socialLinks = DEFAULT_SOCIAL_LINKS.map(defaultLink => {
              const existing = meta.socialLinks?.find((l: SocialLink) => l.id === defaultLink.id);
              return existing ? { ...defaultLink, url: existing.url, active: existing.active } : defaultLink;
            });
          }

          // Migration logic for medallions
          let medallions: Medallion[] = [];
          if (meta.medallions) {
            if (Array.isArray(meta.medallions)) {
              if (meta.medallions.length > 0 && typeof meta.medallions[0] === 'string') {
                // Migration from string[] to Medallion[]
                medallions = (meta.medallions as unknown as string[]).map(url => ({
                  id: generateId(),
                  imageUrl: url,
                  linkUrl: ""
                }));
              } else {
                medallions = meta.medallions;
              }
            }
          }

          setData((prev) => ({
            ...prev,
            firstName: meta.firstName ?? prev.firstName,
            lastName: meta.lastName ?? prev.lastName,
            title: meta.title ?? prev.title,
            department: meta.department ?? prev.department,
            phone: meta.phone ?? prev.phone,
            email: meta.email ?? prev.email,
            ...meta,
            socialLinks,
            medallions: medallions.length > 0 ? medallions : (meta.medallions || []),
            accentColor: meta.accentColor || DEFAULT_COLOR,
            template: meta.template || "professional",
            textColor: meta.textColor || DEFAULT_TEXT_COLOR,
            backgroundColor: meta.backgroundColor || DEFAULT_BACKGROUND_COLOR,
            transparentBackground: meta.transparentBackground || false,
            imageShape: meta.imageShape || "circle",
          }));
        }
      } catch (error) {
        console.error("Failed to parse signature meta:", error);
      }
    };

    fetchProfile();
  }, [hasAccess]);

  // Handler: Input Change
  const startUpdate = (field: keyof SignatureData, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  // Handler: Add Social Link (no longer needed with fixed list)
  const addSocialLink = () => {
    // This function is no longer needed as social links are a fixed list.
    // Keeping it as a placeholder if dynamic links are re-introduced.
    toast.error("Social links are now a fixed list. Just fill in the URLs.");
  };

  // Handler: Update social link
  const updateSocialLink = (id: SocialPlatform, field: keyof SocialLink, value: any) => {
    setData(prev => ({
      ...prev,
      socialLinks: prev.socialLinks.map(link => {
        if (link.id === id) {
          const updated = { ...link, [field]: value };
          // Auto-activate if url is provided
          if (field === "url") {
            updated.active = value.length > 0;
          }
          return updated;
        }
        return link;
      })
    }));
  };

  // Handler: Remove Social Link (no longer needed with fixed list)
  const removeSocialLink = (id: string) => {
    // This function is no longer needed as social links are a fixed list.
    // To "remove" a link, the user just clears its URL.
    toast.error("To remove a social link, simply clear its URL.");
  };

  // Handler: Reorder Social Links
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(data.socialLinks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setData((prev) => ({
      ...prev,
      socialLinks: items,
    }));
  };

  // Handler: Image Upload
  const handleImageUpload = async (file: File, field: "profileImage" | "companyLogoUrl") => {
    setUploading(true);
    try {
      // SPECIAL HANDLING FOR COMPANY LOGO:
      // Upload RAW to preserve transparency perfectly for all formats (PNG, WebP, GIF, etc).
      // This fixes the issue where logos were getting black backgrounds or artifacts.
      if (field === "companyLogoUrl") {
        const formData = new FormData();
        formData.append("file", file); // Upload raw file

        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const json = await res.json();

        if (res.ok && json?.document?.document_file_url) {
          startUpdate(field, json.document.document_file_url);
          toast.success("Logo uploaded!");
          return json.document.document_file_url;
        } else {
          throw new Error(json?.error || "Upload failed");
        }
      }

      // Normal processing for Profile Images or non-PNGs (resize, compress, force PNG output)
      const reader = new FileReader();
      const dataURL: string = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = dataURL;
      });

      const maxSide = 800;
      const scale = Math.min(maxSide / img.width, maxSide / img.height, 1);
      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Ensure transparent background
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // ALWAYS use PNG to ensure transparency is preserved.
        // Even if original was JPEG, converting to PNG is safe.
        // If original was transparent PNG, this keeps it transparent.
        const outputType = "image/png";

        const blob: Blob = await new Promise((resolve) =>
          canvas.toBlob((b) => resolve(b!), outputType, 1.0)
        );

        const formData = new FormData();
        // Force filename to have .png extension to match the mime type
        const safeName = file.name.replace(/\.[^/.]+$/, "") + ".png";
        formData.append("file", new File([blob], safeName, { type: "image/png" }));

        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const json = await res.json();

        if (res.ok && json?.document?.document_file_url) {
          startUpdate(field, json.document.document_file_url);
          toast.success("Image uploaded!");
          return json.document.document_file_url; // Return URL for medallions
        } else {
          throw new Error(json?.error || "Upload failed");
        }
      }
    }
    catch (e: any) {
      toast.error(e.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  // Handler: Add Medallion
  const addMedallion = (url: string) => {
    setData(prev => ({
      ...prev,
      medallions: [...prev.medallions, { id: generateId(), imageUrl: url, linkUrl: "" }]
    }));
  };

  // Handler: Remove Medallion
  const removeMedallion = (id: string) => {
    setData(prev => ({
      ...prev,
      medallions: prev.medallions.filter(m => m.id !== id)
    }));
  };

  // Handler: Update Medallion Link
  const updateMedallionLink = (id: string, linkUrl: string) => {
    setData(prev => ({
      ...prev,
      medallions: prev.medallions.map(m => m.id === id ? { ...m, linkUrl } : m)
    }));
  };

  // --- Generator ---

  const generateHTML = () => {
    const {
      firstName, lastName, title, department, phone, email, website,
      profileImage, companyLogoUrl, companyTagline, accentColor,
      template, socialLinks, textColor, backgroundColor, highlightLastName, transparentBackground, medallions, imageShape
    } = data;

    // Helper: Format Phone Number (+1 XXX-XXX-XXXX)
    const formatPhoneNumber = (str: string) => {
      if (!str) return "";
      const cleaned = ('' + str).replace(/\D/g, '');
      const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
      if (match) {
        return `+1 ${match[1]}-${match[2]}-${match[3]}`;
      }
      return str;
    };
    const formattedPhone = formatPhoneNumber(phone);
    const telHref = phone ? `tel:${phone}` : ''; // Keep original for tel or we can sanitize: phone.replace(/[^0-9+]/g, '')

    const getImageStyle = (baseSize: number) => {
      let style = `object-fit: cover; display: block;`;

      if (imageShape === "rounded") {
        style += ` border-radius: 10px; width: ${baseSize}px; height: ${baseSize}px; aspect-ratio: 1;`;
      } else if (imageShape === "oval") {
        style += ` border-radius: 50%; width: ${baseSize}px; height: ${baseSize * 1.25}px;`;
      } else {
        // circle (default)
        style += ` border-radius: 50%; width: ${baseSize}px; height: ${baseSize}px; aspect-ratio: 1;`;
      }
      return style;
    };

    const rgb = hexToRgb(accentColor);
    const textRgb = hexToRgb(textColor);

    const nameHtml = highlightLastName
      ? `${firstName} <span style="color: ${accentColor};">${lastName}</span>`
      : `${firstName} ${lastName}`;

    // Wrapper style for background color
    const bgColorStyle = transparentBackground ? 'background-color: transparent;' : `background-color: ${backgroundColor};`;
    const wrapperStyle = `${bgColorStyle} padding: 20px;`;
    const wrapperStart = `<div style="${wrapperStyle}">`;
    const wrapperEnd = `</div>`;

    // Social Icons HTML
    // We use a table for maximum email client compatibility
    const activeSocials = socialLinks.filter(l => l.active && l.url);
    const socialHtml = activeSocials.length > 0 ? `
      <table cellpadding="0" cellspacing="0" border="0" style="display:inline-block; margin-top:8px;">
        <tr>
          ${activeSocials.map(link => {
      // Map platform to icon URL (using a reliable CDN or internal assets if preferred)
      // For this demo, using icons8 or similar public icons if direct access isn't available,
      // OR we can map to the SVG path if we want to inline (unsupported in some clients),
      // OR use the existing CDN links seen in original file.

      // Re-using the CDN links from original file where possible
      let iconUrl = "";
      switch (link.platform) {
        case "linkedin": iconUrl = "https://storage.googleapis.com/tgl_cdn/images/Social/icons8-linkedin-50.png"; break;
        case "twitter": iconUrl = "https://img.icons8.com/ios-filled/50/000000/twitterx.png"; break; // Direct working X logo
        case "facebook": iconUrl = "https://storage.googleapis.com/tgl_cdn/images/Social/icons8-facebook-50.png"; break;
        case "instagram": iconUrl = "https://storage.googleapis.com/tgl_cdn/images/Social/icons8-instagram-50.png"; break;
        case "medium": iconUrl = "https://storage.googleapis.com/tgl_cdn/images/Social/icons8-medium-50.png"; break;
        case "patreon": iconUrl = "https://storage.googleapis.com/tgl_cdn/images/Social/icons8-patreon-50.png"; break;
        case "youtube": iconUrl = "https://storage.googleapis.com/tgl_cdn/images/Social/YouTube.png"; break;
        case "discord": iconUrl = "https://storage.googleapis.com/tgl_cdn/images/Social/Discord-Symbol-Blurple.png"; break;
        case "github": iconUrl = "https://img.icons8.com/ios-filled/50/000000/github.png"; break;
        default: iconUrl = "https://storage.googleapis.com/tgl_cdn/images/symbols/web.png"; // Fallback
      }

      return `
              <td style="padding-right: 6px;">
                <a href="${ensureAbsoluteUrl(link.url, link.platform)}" target="_blank" style="text-decoration:none;">
                  <img src="${iconUrl}" width="${link.platform === 'twitter' ? 20 : 26}" height="${link.platform === 'twitter' ? 20 : 26}" alt="${link.platform}" style="display:block; border:0;" />
                </a>
              </td>
            `;
    }).join("")}
        </tr>
      </table>
    ` : "";

    const medallionsHtml = medallions && medallions.length > 0 ? `
      <div style="margin-top: 16px; padding-top: 16px; border-top: 1px dashed rgba(0,0,0,0.1);">
         <table cellpadding="0" cellspacing="0" border="0">
           <tr>
             ${medallions.map(m => `
               <td style="padding-right: 12px;">
                 <a href="${ensureAbsoluteUrl(m.linkUrl) || '#'}" style="text-decoration: none; cursor: ${m.linkUrl ? 'pointer' : 'default'};">
                   <img src="${m.imageUrl}" height="40" style="display: block; max-height: 40px; width: auto;" alt="Award" />
                 </a>
               </td>
             `).join("")}
           </tr>
         </table>
      </div>
    ` : "";

    // Template 1: Professional (Card style)
    if (template === "professional") {
      const showLeftColumn = profileImage || (medallions && medallions.length > 0);

      return `
        ${wrapperStart}
        <table cellpadding="0" cellspacing="0" border="0" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; width: auto;">
          <tr>
            <td style="padding: 16px; border-left: 4px solid ${accentColor}; background-color: rgba(${rgb}, 0.03);">

              <table cellpadding="0" cellspacing="0" border="0" style="width: auto;">
                <tr>
                  ${showLeftColumn ? `
                  <td valign="top" style="padding-right: 20px; width: 125px;">
                    ${profileImage ? `<img src="${profileImage}" width="100" height="${imageShape === 'oval' ? 125 : 100}" style="${getImageStyle(100)} margin-bottom: 12px;" alt="${firstName}" />` : ''}
                    
                    ${companyLogoUrl ? `
                      <img src="${companyLogoUrl}" width="100" style="display: block; width: 100px; height: auto; margin-top: 12px;" alt="Logo" />
                    ` : ''}
                  </td>
                  ` : ''}
                  <td valign="top">
                    <h3 style="margin: 0; font-size: 22px; color: ${textColor}; font-weight: 700;">
                      ${nameHtml}
                    </h3>
                    <p style="margin: 4px 0 10px 0; font-size: 16px; color: ${accentColor}; font-weight: 600;">
                      ${title}
                      ${department ? `<span style="color: rgba(${textRgb}, 0.6); font-weight: normal;"> • ${department}</span>` : ''}
                    </p>

                    ${companyTagline ? `
                      <p style="margin: 0 0 12px 0; font-size: 14px; font-style: italic; color: rgba(${textRgb}, 0.7);">${companyTagline}</p>
                    ` : ''}

                    <table cellpadding="0" cellspacing="0" border="0" style="font-size: 14px; color: rgba(${textRgb}, 0.8);">
                      ${phone ? `
                        <tr>
                          <td width="24" style="padding-bottom: 6px; vertical-align: middle;">
                            <img src="${getIconUrl('phone', accentColor)}" width="14" height="14" alt="P" style="display: block;" />
                          </td>
                          <td style="padding-bottom: 6px; vertical-align: middle;"><a href="${telHref}" style="color: inherit; text-decoration: none;">${formattedPhone}</a></td>
                        </tr>
                      ` : ''}
                      ${email ? `
                        <tr>
                          <td width="24" style="padding-bottom: 6px; vertical-align: middle;">
                             <img src="${getIconUrl('mail', accentColor)}" width="14" height="14" alt="E" style="display: block;" />
                          </td>
                          <td style="padding-bottom: 6px; vertical-align: middle;"><a href="mailto:${email}" style="color: inherit; text-decoration: none;">${email}</a></td>
                        </tr>
                      ` : ''}
                      ${website ? `
                        <tr>
                          <td width="24" style="padding-bottom: 6px; vertical-align: middle;">
                             <img src="${getIconUrl('globe', accentColor)}" width="14" height="14" alt="W" style="display: block;" />
                          </td>
                          <td style="padding-bottom: 6px; vertical-align: middle;"><a href="${ensureAbsoluteUrl(website, 'website')}" style="color: inherit; text-decoration: none;">${website}</a></td>
                        </tr>
                      ` : ''}
                    </table>

                    ${socialHtml}

                    ${!showLeftColumn && medallions && medallions.length > 0 ? medallionsHtml : ''}
                  </td>
                </tr>
              </table>

              ${showLeftColumn && medallions && medallions.length > 0 ? medallionsHtml : ''}

            </td>
          </tr>
        </table>
        ${wrapperEnd}
      `;
    }

    // Template 2: Modern (Horizontal bar logic)
    if (template === "modern") {
      return `
        ${wrapperStart}
        <table cellpadding="0" cellspacing="0" border="0" style="font-family: Helvetica, Arial, sans-serif; width: auto;">
          <tr>
            <td valign="middle" style="padding-right: 20px;">
               ${profileImage ? `<img src="${profileImage}" width="80" height="${imageShape === 'oval' ? 100 : 80}" style="${getImageStyle(80)}" />` : ''}
               ${companyLogoUrl ? `<div style="margin-top:8px;"><img src="${companyLogoUrl}" width="80" style="display:block;width:80px;height:auto;" /></div>` : ''}
            </td>
            <td style="border-left: 2px solid ${accentColor}; padding-left: 20px;">
              <h3 style="margin: 0; font-size: 18px; color: ${textColor}; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">
                ${nameHtml}
              </h3>
              <p style="margin: 2px 0 8px 0; font-size: 12px; font-weight: 600; color: ${accentColor}; text-transform: uppercase;">
                 ${title} ${department ? `// ${department}` : ''}
              </p>

              <div style="font-size: 12px; line-height: 1.5;">
                ${phone ? `<div><img src="${getIconUrl('phone', accentColor)}" width="10" height="10" style="vertical-align: middle; margin-right: 4px;" /> ${formattedPhone}</div>` : ''}
                ${email ? `<div><img src="${getIconUrl('mail', accentColor)}" width="10" height="10" style="vertical-align: middle; margin-right: 4px;" /> <a href="mailto:${email}" style="color:inherit; text-decoration:none;">${email}</a></div>` : ''}
                ${website ? `<div><img src="${getIconUrl('globe', accentColor)}" width="10" height="10" style="vertical-align: middle; margin-right: 4px;" /> <a href="${ensureAbsoluteUrl(website, 'website')}" style="color:inherit; text-decoration:none;">${website}</a></div>` : ''}
              </div>

               ${socialHtml}
               ${medallionsHtml}
            </td>
          </tr>
        </table>
        ${wrapperEnd}
      `;
    }

    // Template 3: Minimalist
    if (template === "minimalist") {
      return `
        ${wrapperStart}
        <div style="font-family: 'Courier New', Courier, monospace; width: auto;">
          <h2 style="margin: 0; font-size: 20px; color: ${textColor}; border-bottom: 2px solid ${accentColor}; display: inline-block; padding-bottom: 4px;">
            ${nameHtml}
          </h2>
          <p style="margin: 6px 0 12px 0; font-size: 14px; color: rgba(${textRgb}, 0.7);">
            ${title} ${department ? `<br/><span style="font-size:12px;">${department}</span>` : ''}
          </p>

          <div style="display: flex; align-items: flex-start; gap: 16px;">
             ${profileImage ? `<div><img src="${profileImage}" width="60" height="${imageShape === 'oval' ? 75 : 60}" style="${getImageStyle(60)}" /></div>` : ''}
             <div style="flex: 1;">
                 ${companyLogoUrl ? `<div style="margin-bottom:8px;"><img src="${companyLogoUrl}" height="24" style="display:block;height:24px;width:auto;" /></div>` : ''}
                 <div style="font-size: 12px; line-height: 1.6;">
                   ${phone ? `<div>P: ${formattedPhone}</div>` : ''}
                   ${email ? `<div>E: <a href="mailto:${email}" style="color: inherit; text-decoration: none;">${email}</a></div>` : ''}
                   ${website ? `<div>W: <a href="${ensureAbsoluteUrl(website, 'website')}" style="color: inherit; text-decoration: none;">${website}</a></div>` : ''}
                 </div>
                 ${socialHtml}
                 ${medallionsHtml}
             </div>
          </div>
        </div>
        ${wrapperEnd}
      `;
    }

    // Template 4: Elegant (Serif, Centered)
    if (template === "elegant") {
      return `
        ${wrapperStart}
        <table cellpadding="0" cellspacing="0" border="0" style="font-family: Georgia, serif; max-width: 700px; width: 100%; border-top: 5px solid ${accentColor}; border-bottom: 5px solid ${accentColor};">
          <tr>
            <td align="center" style="padding: 24px;">
              ${profileImage ? `
                <img src="${profileImage}" width="100" height="${imageShape === 'oval' ? 125 : 100}" style="${getImageStyle(100)} margin-bottom: 16px; border: 4px solid #f7fafc;" alt="${firstName}" />
              ` : ''}
              <div style="font-size: 24px; font-weight: bold; color: ${textColor}; letter-spacing: 0.5px;">${nameHtml}</div>
              <div style="font-size: 14px; color: ${accentColor}; font-style: italic; margin-bottom: 16px;">${title} ${department ? `k &mdash; ${department}` : ''}</div>

              <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                ${phone ? `<tr><td style="padding: 2px 8px; font-size: 13px; color: rgba(${textRgb}, 0.8);"><img src="${getIconUrl('phone', accentColor)}" width="12" height="12" style="vertical-align: middle; margin-right: 6px;" /> ${formattedPhone}</td></tr>` : ''}
                ${email ? `<tr><td style="padding: 2px 8px; font-size: 13px; color: rgba(${textRgb}, 0.8);"><img src="${getIconUrl('mail', accentColor)}" width="12" height="12" style="vertical-align: middle; margin-right: 6px;" /> <a href="mailto:${email}" style="color: inherit; text-decoration: none;">${email}</a></td></tr>` : ''}
                ${website ? `<tr><td style="padding: 2px 8px; font-size: 13px; color: rgba(${textRgb}, 0.8);"><img src="${getIconUrl('globe', accentColor)}" width="12" height="12" style="vertical-align: middle; margin-right: 6px;" /> <a href="${ensureAbsoluteUrl(website, 'website')}" style="color: inherit; text-decoration: none;">${website}</a></td></tr>` : ''}
              </table>

              <div style="margin-top: 16px;">
                ${socialHtml}
              </div>

              ${medallionsHtml}
            </td>
          </tr>
        </table>
        ${wrapperEnd}
      `;
    }

    // Template 5: Creative (Sidebar Color)
    if (template === "creative") {
      return `
        ${wrapperStart}
        <table cellpadding="0" cellspacing="0" border="0" style="font-family: 'Segoe UI', sans-serif; max-width: 500px; width: 100%;">
          <tr>
            <td valign="top" style="background-color: ${accentColor}; padding: 20px; border-radius: 12px 0 0 12px; text-align: center; width: 120px;">
               ${profileImage ? `
                <img src="${profileImage}" width="80" height="${imageShape === 'oval' ? 100 : 80}" style="${getImageStyle(80)} margin: 0 auto 12px auto; border: 2px solid rgba(255,255,255,0.3);" alt="${firstName}" />
              ` : ''}
              <div style="font-size: 24px; color: #fff; font-weight: 900; line-height: 1;">${firstName.charAt(0)}${lastName.charAt(0)}</div>
            </td>
            <td valign="top" style="padding: 20px; border: 1px solid #e2e8f0; border-left: 0; border-radius: 0 12px 12px 0; background-color: #fff;">
              <h3 style="margin: 0; font-size: 20px; color: ${textColor};">${nameHtml}</h3>
              <div style="color: ${accentColor}; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">${title}</div>

              <div style="font-size: 13px; color: rgba(${textRgb}, 0.7); line-height: 1.6;">
                ${phone ? `<div style="display: flex; align-items: center; gap: 6px;"><img src="${getIconUrl('phone', accentColor)}" width="14" height="14" /> ${formattedPhone}</div>` : ''}
                ${email ? `<div style="display: flex; align-items: center; gap: 6px;"><img src="${getIconUrl('mail', accentColor)}" width="14" height="14" /> <a href="mailto:${email}" style="color: inherit; text-decoration: none;">${email}</a></div>` : ''}
                ${website ? `<div style="display: flex; align-items: center; gap: 6px;"><img src="${getIconUrl('globe', accentColor)}" width="14" height="14" /> <a href="${ensureAbsoluteUrl(website, 'website')}" style="color: inherit; text-decoration: none;">${website}</a></div>` : ''}
              </div>

               <div style="margin-top: 12px;">${socialHtml}</div>

               ${medallionsHtml}
            </td>
          </tr>
        </table>
        ${wrapperEnd}
      `;
    }

    // Template 6: Banner (Bottom Focus)
    if (template === "banner") {
      return `
        ${wrapperStart}
        <table cellpadding="0" cellspacing="0" border="0" style="font-family: Helvetica, Arial, sans-serif; max-width: 550px; width: 100%; border-left: 4px solid ${accentColor};">
          <tr>
            <td style="padding-left: 16px;">
               <div style="font-size: 24px; font-weight: 800; color: ${textColor};">${nameHtml}</div>
               <div style="font-size: 16px; color: ${accentColor}; font-weight: 500; margin-bottom: 8px;">${title} // ${department || 'Team'}</div>

               <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 12px;">
                 <tr>
                   ${phone ? `<td style="padding-right: 12px; font-size: 13px; color: rgba(${textRgb}, 0.8);"><img src="${getIconUrl('phone', accentColor)}" width="11" height="11" style="vertical-align:middle; margin-right:4px;" /> ${formattedPhone}</td>` : ''}
                   ${email ? `<td style="padding-right: 12px; font-size: 13px; color: rgba(${textRgb}, 0.8);"><img src="${getIconUrl('mail', accentColor)}" width="11" height="11" style="vertical-align:middle; margin-right:4px;" /> <a href="mailto:${email}" style="color: inherit; text-decoration: none;">${email}</a></td>` : ''}
                  </tr>
                  <tr>
                    ${website ? `<td colspan="2" style="padding-top: 4px; font-size: 13px; color: rgba(${textRgb}, 0.8);"><img src="${getIconUrl('globe', accentColor)}" width="11" height="11" style="vertical-align:middle; margin-right:4px;" /> <a href="${ensureAbsoluteUrl(website, 'website')}" style="color: inherit; text-decoration: none;">${website}</a></td>` : ''}
                  </tr>
                </table>

               <div style="display: flex; align-items: center; gap: 12px;">
                 ${socialHtml}
               </div>

               ${companyLogoUrl ? `
                 <div style="margin-top: 16px; padding-top: 16px; border-top: 1px dotted #ccc;">
                   <img src="${companyLogoUrl}" style="height: 30px; display: block;" alt="Logo" />
                 </div>
               ` : ''}

               <div style="margin-top: 8px; font-size: 10px; color: #999;">${companyTagline || 'Sent securely via our CRM.'}</div>

               ${medallionsHtml}
            </td>
          </tr>
        </table>
        ${wrapperEnd}
      `;
    }

    // Template 7: Corporate (Grid)
    if (template === "corporate") {
      const showLeftColumn = profileImage || (medallions && medallions.length > 0);
      return `
        ${wrapperStart}
        <table cellpadding="0" cellspacing="0" border="0" style="font-family: Arial, sans-serif; max-width: 800px; width: 100%;">
          <tr>
            ${showLeftColumn ? `
            <td valign="top" width="90" style="padding-right: 16px;">
              ${profileImage ? `
                 <img src="${profileImage}" width="80" height="${imageShape === 'oval' ? 100 : 80}" style="${getImageStyle(80)} margin-bottom: 12px;" />
              ` : ''}

              ${medallions && medallions.length > 0 ? `
                <div style="margin-top: 12px; text-align: center;">
                    ${medallions.map(m => `
                      <a href="${ensureAbsoluteUrl(m.linkUrl) || '#'}" style="text-decoration: none; cursor: ${m.linkUrl ? 'pointer' : 'default'};">
                         <img src="${m.imageUrl}" height="32" style="display: inline-block; max-height: 32px; width: auto; margin: 2px;" alt="Award" />
                      </a>
                    `).join("")}
                </div>
              ` : ''}
            </td>
            ` : ''}
            <td valign="middle" style="border-left: 2px solid #ddd; padding-left: 16px;">
               <div style="font-size: 18px; font-weight: bold; color: ${textColor};">${nameHtml}</div>
               <div style="font-size: 14px; color: ${accentColor}; font-weight: bold; margin-bottom: 4px;">${title}</div>
               <div style="font-size: 13px; color: #555;">${department}</div>
            </td>
          </tr>
          <tr>
            <td colspan="2" style="padding-top: 12px;">
              <div style="font-size: 12px; display: flex; gap: 16px; color: ${textColor};">
                 ${phone ? `<span><b style="color:${accentColor}">P:</b> ${formattedPhone}</span>` : ''}
                 ${email ? `<span><b style="color:${accentColor}">E:</b> <a href="mailto:${email}" style="color:inherit; text-decoration:none;">${email}</a></span>` : ''}
                 ${website ? `<span><b style="color:${accentColor}">W:</b> <a href="${ensureAbsoluteUrl(website, 'website')}" style="color:inherit; text-decoration:none;">${website}</a></span>` : ''}
              </div>
              <div style="margin-top: 12px; display: flex; align-items: center; gap: 12px;">
                 ${socialHtml}
                 ${companyLogoUrl ? `<img src="${companyLogoUrl}" height="24" style="margin-left: auto;" />` : ''}
              </div>
            </td>
          </tr>
        </table>
        ${wrapperEnd}
      `;
    }

    // Template 8: Compact (Small)
    if (template === "compact") {
      return `
        ${wrapperStart}
        <div style="font-family: sans-serif; font-size: 12px; color: ${textColor};">
           <div style="font-weight: bold; font-size: 14px;">${nameHtml} <span style="font-weight: normal; color: ${accentColor}; mx-2">|</span> <span style="font-weight: normal; color: #666;">${title}</span></div>
           <div style="margin-top: 4px;">
              ${phone ? `<a href="${telHref}" style="color:inherit; text-decoration:none; margin-right: 8px;">${formattedPhone}</a>` : ''}
              ${email ? `<a href="mailto:${email}" style="color:inherit; text-decoration:none; margin-right: 8px;">${email}</a>` : ''}
              ${website ? `<a href="${ensureAbsoluteUrl(website, 'website')}" style="color:inherit; text-decoration:none;">${website}</a>` : ''}
           </div>
           <div style="margin-top: 6px;">${socialHtml}</div>
           ${medallionsHtml}
        </div>
        ${wrapperEnd}
      `;
    }


    // Template 3: Modern (Bottom bar) - REMOVED redundant block to fix TS error
    // (We already handled 'modern' above)

    // Template 9: Tech (Monospace, Code Block)
    if (template === "tech") {
      return `
        ${wrapperStart}
    <div style="font-family: 'Courier New', Courier, monospace; color: ${textColor}; max-width: 600px; padding: 16px; border: 1px solid ${accentColor}; border-radius: 8px; background-color: ${transparentBackground ? 'rgba(0,0,0,0.8)' : '#1e1e1e'};">
      <div style="color: ${accentColor}; margin-bottom: 12px;">// ${title}</div>
      <div style="display: flex; gap: 20px; align-items: flex-start;">
        ${profileImage ? `<img src="${profileImage}" width="80" height="${imageShape === 'oval' ? 100 : 80}" style="${getImageStyle(80)} border: 2px solid ${accentColor};" />` : ''}
        <div>
          <div style="font-size: 20px; font-weight: bold; color: #fff;">const <span style="color: ${accentColor};">Method</span> = "${nameHtml}";</div>
          ${department ? `<div style="font-size: 13px; color: #888; margin-top: 4px;">// ${department}</div>` : ''}

          <div style="margin-top: 16px; font-size: 12px; color: #ccc;">
            ${phone ? `<div>phone: <span style="color: #a5d6ff;">"${formattedPhone}"</span>,</div>` : ''}
            ${email ? `<div>email: <span style="color: #a5d6ff;">"${email}"</span>,</div>` : ''}
            ${website ? `<div>web: <span style="color: #a5d6ff;">"<a href="${ensureAbsoluteUrl(website, 'website')}" style="color:inherit;text-decoration:none;">${website}</a>"</span>,</div>` : ''}
          </div>


          <div style="margin-top: 16px;">
            <span style="color: #888;">return</span> [
            ${activeSocials.map(s => `<a href="${ensureAbsoluteUrl(s.url, s.platform)}" style="color: ${accentColor}; text-decoration: none; margin-right: 8px;">${s.platform}</a>`).join(", ")}
            ];
          </div>
          ${medallionsHtml}
        </div>
      </div>
      <div style="margin-top: 12px; color: ${accentColor};">}</div>
    </div>
        ${wrapperEnd}
    `;
    }

    // Template 10: Classic (Serif, Centered Divider)
    if (template === "classic") {
      return `
         ${wrapperStart}
    <table cellpadding="0" cellspacing="0" border="0" style="font-family: Georgia, 'Times New Roman', Times, serif; max-width: 600px; width: 100%; text-align: center;">
      <tr>
        <td align="center">
          ${profileImage ? `<img src="${profileImage}" width="100" height="${imageShape === 'oval' ? 125 : 100}" style="${getImageStyle(100)} margin-bottom: 16px;" />` : ''}
          <div style="font-size: 26px; font-weight: normal; color: ${textColor}; letter-spacing: 1px; text-transform: uppercase;">${nameHtml}</div>
          <div style="font-size: 14px; color: ${accentColor}; font-style: italic; margin-top: 6px;">${title}</div>

          <div style="width: 40px; height: 2px; background-color: ${accentColor}; margin: 16px auto;"></div>

          <div style="font-size: 13px; color: rgba(${textRgb}, 0.8); line-height: 1.8;">
            ${phone ? `${formattedPhone} &nbsp;|&nbsp;` : ''}
            ${email ? `<a href="mailto:${email}" style="color: inherit; text-decoration: none;">${email}</a>` : ''}
            ${website ? `&nbsp;|&nbsp; <a href="${ensureAbsoluteUrl(website, 'website')}" style="color: inherit; text-decoration: none;">${website}</a>` : ''}
          </div>

          <div style="margin-top: 16px;">
            ${socialHtml}
          </div>
          ${medallionsHtml}
        </td>
      </tr>
    </table>
         ${wrapperEnd}
    `;
    }

    // Template 11: Social (Icons focus)
    if (template === "social") {
      return `
         ${wrapperStart}
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 500px;">
      <div style="display: flex; align-items: center; gap: 16px;">
        ${profileImage ? `<img src="${profileImage}" width="90" height="${imageShape === 'oval' ? 112 : 90}" style="${getImageStyle(90)} border-radius: 20%;" />` : ''}
        <div>
          <h2 style="margin: 0; font-size: 22px; font-weight: 800; color: ${textColor};">${nameHtml}</h2>
          <div style="font-size: 14px; color: ${accentColor}; font-weight: 700;">@${firstName}${lastName}</div>
          <div style="font-size: 14px; color: #555; margin-top: 4px;">${title}</div>
        </div>
      </div>

      <div style="margin-top: 16px; background: rgba(${rgb}, 0.05); padding: 12px; border-radius: 12px; display: inline-block;">
        ${socialHtml}
      </div>

      <div style="margin-top: 12px; font-size: 13px;">
        ${email ? `<b>E:</b> <a href="mailto:${email}" style="text-decoration:none; color:${textColor};">${email}</a> &nbsp; ` : ''}
        ${website ? `<b>W:</b> <a href="${ensureAbsoluteUrl(website, 'website')}" style="text-decoration:none; color:${textColor};">${website}</a>` : ''}
      </div>
      ${medallionsHtml}
    </div>
         ${wrapperEnd}
    `;
    }

    // Template 12: Dense (Grid layout)
    if (template === "dense") {
      return `
        ${wrapperStart}
    <table cellpadding="0" cellspacing="0" border="0" style="font-family: Helvetica, Arial, sans-serif; font-size: 12px; color: ${textColor}; border: 1px solid #ddd; border-left: 5px solid ${accentColor}; padding: 10px;">
      <tr>
        ${profileImage ? `<td valign="top" style="padding-right: 12px;"><img src="${profileImage}" width="60" height="${imageShape === 'oval' ? 75 : 60}" style="${getImageStyle(60)}" /></td>` : ''}
        <td valign="top">
          <div style="font-weight: bold; font-size: 14px;">${nameHtml}</div>
          <div style="color: ${accentColor}; font-weight: bold; margin-bottom: 6px;">${title}</div>

          <table cellpadding="0" cellspacing="0" border="0" style="font-size: 11px; color: #555; width: 100%;">
            <tr>
              ${phone ? `<td style="padding: 2px 0;"><b>Tel:</b> ${formattedPhone}</td>` : ''}
              ${email ? `<td style="padding: 2px 0;"><b>Email:</b> <a href="mailto:${email}" style="color:inherit; text-decoration:none;">${email}</a></td>` : ''}
            </tr>
            <tr>
              ${website ? `<td style="padding: 2px 0;"><b>Web:</b> <a href="${ensureAbsoluteUrl(website, 'website')}" style="color:inherit; text-decoration:none;">${website}</a></td>` : ''}
              ${department ? `<td style="padding: 2px 0;"><b>Dept:</b> ${department}</td>` : ''}
            </tr>
          </table>

          <div style="margin-top: 8px;">${socialHtml}</div>
        </td>
      </tr>
      ${medallions && medallions.length > 0 ? `<tr><td colspan="2" style="padding-top: 8px; border-top: 1px solid #eee; margin-top: 8px;">${medallionsHtml}</td></tr>` : ''}
    </table>
        ${wrapperEnd}
    `;
    }

    // Fallback?
    return ``; // Should catch one of the above
  };

  // Handler: Save
  const handleSave = async () => {
    try {
      setSaving(true);
      const html = generateHTML();

      // Sanitize data before saving to ensure consumers of the JSON get absolute URLs
      const sanitizedData = {
        ...data,
        website: ensureAbsoluteUrl(data.website, 'website'),
        socialLinks: data.socialLinks.map(link => ({
          ...link,
          url: ensureAbsoluteUrl(link.url, link.platform)
        })),
        medallions: data.medallions.map(m => ({
          ...m,
          linkUrl: ensureAbsoluteUrl(m.linkUrl)
        }))
      };

      const payload = {
        signatureHtml: html,
        meta: sanitizedData
      };

      const res = await fetch("/api/profile/signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save");
      toast.success("Signature saved to profile!");
    } catch (e: any) {
      toast.error(e.message || "Something went wrong saving");
    } finally {
      setSaving(false);
    }
  };

  // Handler: Copy
  const handleCopy = async () => {
    try {
      const html = generateHTML();
      const blobHtml = new Blob([html], { type: "text/html" });
      const blobText = new Blob([`${data.firstName} ${data.lastName} - ${data.title} `], { type: "text/plain" }); // Fallback plain

      const item = new ClipboardItem({
        "text/html": blobHtml,
        "text/plain": blobText,
      });
      await navigator.clipboard.write([item]);
      toast.success("Copied to clipboard!");
    } catch (e) {
      console.error(e);
      toast.error("Clipboard access failed. Select and copy manually from preview.");
    }
  };

  // Handler: Sync to Gmail
  const handleSync = async () => {
    try {
      setSyncing(true);
      const html = generateHTML();
      const res = await fetch("/api/profile/signature/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatureHtml: html }),
      });

      if (!res.ok) {
        const txt = await res.text();
        if (res.status === 400 && txt.includes("Gmail not connected")) {
          // Trigger auth flow
          const authRes = await fetch("/api/google/auth-url");
          const authJson = await authRes.json();
          if (authJson.url) {
            window.location.href = authJson.url;
            return;
          }
        }
        throw new Error(txt || "Failed to sync");
      }

      const json = await res.json();
      toast.success(`Synced to ${json.updatedCount} Gmail addresses!`);
    } catch (e: any) {
      toast.error(e.message || "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  if (!hasAccess) return <div className="p-10 text-center text-muted-foreground">Access Denied</div>;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 h-full">
      {/* Editor Column */}
      <div className="xl:col-span-7 space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="design"><Palette className="w-4 h-4 mr-2" /> Style</TabsTrigger>
            <TabsTrigger value="content"><UserIcon className="w-4 h-4 mr-2" /> Info</TabsTrigger>
            <TabsTrigger value="images"><ImageIcon className="w-4 h-4 mr-2" /> Images</TabsTrigger>
            <TabsTrigger value="social"><Share2 className="w-4 h-4 mr-2" /> Social</TabsTrigger>
          </TabsList>

          <div className="mt-6 space-y-4">
            <TabsContent value="content" className="space-y-4 animate-in fade-in-50">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Details</CardTitle>
                  <CardDescription>Enter your contact information.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>First Name</Label>
                      <Input value={data.firstName} onChange={(e) => startUpdate("firstName", e.target.value)} placeholder="Jane" />
                    </div>
                    <div className="space-y-2">
                      <Label>Last Name</Label>
                      <Input value={data.lastName} onChange={(e) => startUpdate("lastName", e.target.value)} placeholder="Doe" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Job Title</Label>
                    <Input value={data.title} onChange={(e) => startUpdate("title", e.target.value)} placeholder="CEO" />
                  </div>
                  {isVisible("department") && (
                    <div className="space-y-2">
                      <Label>Department</Label>
                      <Input value={data.department} onChange={(e) => startUpdate("department", e.target.value)} placeholder="Engineering" />
                    </div>
                  )}
                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input type="tel" value={data.phone} onChange={(e) => startUpdate("phone", e.target.value)} placeholder="+1 555 000 0000" />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input type="email" value={data.email} onChange={(e) => startUpdate("email", e.target.value)} placeholder="jane@company.com" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Website</Label>
                      <Input value={data.website} onChange={(e) => startUpdate("website", e.target.value)} placeholder="company.com" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="images" className="space-y-4 animate-in fade-in-50">
              <Card>
                <CardHeader>
                  <CardTitle>Imagery</CardTitle>
                  <CardDescription>Upload professional headshot and company logo.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isVisible("profileImage") && (
                    <div className="flex items-start gap-6">
                      <div className="shrink-0">
                        <div className="w-24 h-24 rounded-full bg-muted border-2 border-dashed border-gray-600 flex items-center justify-center overflow-hidden relative group">
                          {data.profileImage ? (
                            <img src={data.profileImage} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            <UserIcon className="w-8 h-8 text-muted-foreground" />
                          )}
                          <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            <Upload className="w-6 h-6 text-white" />
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], "profileImage")} disabled={uploading} />
                          </label>
                        </div>
                        <p className="text-xs text-center mt-2 text-muted-foreground">Profile Photo</p>
                      </div>

                      <div className="flex-1 space-y-2">
                        <Label>Profile Image URL (Optional)</Label>
                        <Input value={data.profileImage} onChange={(e) => startUpdate("profileImage", e.target.value)} placeholder="https://..." />
                      </div>
                    </div>
                  )}

                  {(isVisible("medallions") || isVisible("companyLogoUrl") || isVisible("companyTagline")) && (
                    <>
                      <Separator />

                      {/* Company Branding Section - Reverted to TOP as per request layout logic */}
                      {(isVisible("companyLogoUrl") || isVisible("companyTagline")) && (
                        <div className="space-y-4 pt-4">
                          <h4 className="font-medium text-sm pt-4">Company Branding</h4>

                          {isVisible("companyTagline") && (
                            <div className="space-y-2">
                              <Label>Company Tagline</Label>
                              <Input value={data.companyTagline} onChange={(e) => startUpdate("companyTagline", e.target.value)} placeholder="Tagline..." />
                            </div>
                          )}

                          {isVisible("companyLogoUrl") && (
                            <div className="flex items-start gap-6">
                              <div className="shrink-0">
                                <div className="w-24 h-24 rounded bg-muted border-2 border-dashed border-gray-600 flex items-center justify-center overflow-hidden relative group">
                                  {data.companyLogoUrl ? (
                                    <img src={data.companyLogoUrl} alt="Company Logo" className="w-full h-full object-contain p-2" />
                                  ) : (
                                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                                  )}
                                  <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                    <Upload className="w-6 h-6 text-white" />
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], "companyLogoUrl")} disabled={uploading} />
                                  </label>
                                </div>
                                <p className="text-xs text-center mt-2 text-muted-foreground">Logo</p>
                              </div>

                              <div className="flex-1 space-y-2">
                                <Label>Logo URL</Label>
                                <Input value={data.companyLogoUrl} onChange={(e) => startUpdate("companyLogoUrl", e.target.value)} placeholder="https://..." />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Medallions Section - Reverted to BOTTOM as per request layout logic */}
                      {isVisible("medallions") && (
                        <div className="space-y-4 pt-4">
                          <Separator />
                          <div>
                            <Label>Medallions / Awards</Label>
                            <CardDescription>Add trust badges, awards, or certification logos to the bottom of your signature.</CardDescription>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {data.medallions.map((medallion, i) => (
                              <div key={medallion.id} className="relative group aspect-square rounded bg-card border flex flex-col items-center justify-center p-2 gap-2">
                                <img src={medallion.imageUrl} alt="Medallion" className="max-w-full max-h-[60%] object-contain" />
                                <Input
                                  placeholder="Link URL"
                                  value={medallion.linkUrl}
                                  onChange={(e) => updateMedallionLink(medallion.id, e.target.value)}
                                  className="h-6 text-[10px] px-1 w-full"
                                />
                                <button
                                  onClick={() => removeMedallion(medallion.id)}
                                  className="absolute top-1 right-1 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                            <label className="aspect-square rounded border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-accent/50 transition-colors">
                              <Plus className="w-6 h-6 text-muted-foreground mb-1" />
                              <span className="text-xs text-muted-foreground">Add</span>
                              <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    try {
                                      setUploading(true);
                                      const url = await handleImageUpload(file, "profileImage"); // Temporarily using profileImage logic for upload
                                      if (url) addMedallion(url);
                                    } catch (err) { toast.error("Upload failed"); }
                                    finally { setUploading(false); }
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="design" className="space-y-4 animate-in fade-in-50">
              <Card>
                <CardHeader>
                  <CardTitle>Look & Feel</CardTitle>
                  <CardDescription>Customize the aesthetics.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex flex-col gap-4 mb-4">
                      <Label>Options</Label>
                      <div className="flex flex-wrap items-center gap-6">
                        {/* Highlight Last Name Switch */}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={data.highlightLastName}
                              onCheckedChange={(c) => startUpdate("highlightLastName", c)}
                            />
                            <Label className="text-sm font-medium">Highlight Last Name</Label>
                          </div>
                        </div>

                        <Separator orientation="vertical" className="h-6 hidden sm:block" />

                        {/* Transparent Background Toggle */}
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={data.transparentBackground}
                            onCheckedChange={(c) => startUpdate("transparentBackground", c)}
                          />
                          <Label className="text-sm font-medium">Transparent Background</Label>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Colors</Label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                      {/* Accent Color */}
                      <div className="space-y-3">
                        <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider pl-1">Accent</span>
                        <ColorPicker
                          value={data.accentColor}
                          onChange={(c) => startUpdate("accentColor", c)}
                        />
                      </div>

                      {/* Text Color */}
                      <div className="space-y-3">
                        <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider pl-1">Text</span>
                        <ColorPicker
                          value={data.textColor}
                          onChange={(c) => startUpdate("textColor", c)}
                        />
                      </div>

                      {/* Background Color */}
                      <div className={`space-y-3 ${data.transparentBackground ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                        <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider pl-1">Background</span>
                        <ColorPicker
                          value={data.backgroundColor}
                          onChange={(c) => startUpdate("backgroundColor", c)}
                          disabled={data.transparentBackground}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />
                  <div className="space-y-4">
                    <Label className="text-base">Profile Picture Shape</Label>
                    <div className="flex gap-4">
                      <div
                        onClick={() => startUpdate("imageShape", "circle")}
                        className={`
                          flex-1 px-6 py-4 border-2 rounded-xl cursor-pointer flex flex-col items-center gap-3 transition-all duration-200
                          ${data.imageShape === 'circle' ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-muted hover:border-border hover:bg-muted/50'}
                        `}
                      >
                        <div className="w-10 h-10 rounded-full bg-foreground/10" />
                        <span className="text-sm font-semibold">Circle</span>
                      </div>
                      <div
                        onClick={() => startUpdate("imageShape", "rounded")}
                        className={`
                          flex-1 px-6 py-4 border-2 rounded-xl cursor-pointer flex flex-col items-center gap-3 transition-all duration-200
                          ${data.imageShape === 'rounded' ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-muted hover:border-border hover:bg-muted/50'}
                        `}
                      >
                        <div className="w-10 h-10 rounded-[8px] bg-foreground/10" />
                        <span className="text-sm font-semibold">Rounded</span>
                      </div>
                      <div
                        onClick={() => startUpdate("imageShape", "oval")}
                        className={`
                          flex-1 px-6 py-4 border-2 rounded-xl cursor-pointer flex flex-col items-center gap-3 transition-all duration-200
                          ${data.imageShape === 'oval' ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-muted hover:border-border hover:bg-muted/50'}
                        `}
                      >
                        <div className="w-8 h-10 rounded-[50%] bg-foreground/10" />
                        <span className="text-sm font-semibold">Oval</span>
                      </div>
                    </div>
                  </div>

                  <Separator />
                  <div className="space-y-4">
                    <Label className="text-base">Layout Template</Label>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {["professional", "modern", "minimalist", "elegant", "creative", "banner", "corporate", "compact", "tech", "classic", "social", "dense"].map((t) => (
                        <div
                          key={t}
                          onClick={() => startUpdate("template", t as any)}
                          className={`
                            cursor-pointer rounded-xl border-2 p-4 py-5 text-center transition-all duration-200 flex items-center justify-center min-h-[70px]
                            ${data.template === t ? "border-primary bg-primary/5 ring-1 ring-primary/20 shadow-sm" : "border-muted hover:border-border hover:bg-muted/30"}
                          `}
                        >
                          <div className="text-sm font-semibold capitalize tracking-tight">{t}</div>
                        </div>
                      ))}
                    </div>
                  </div>


                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="social" className="space-y-4 animate-in fade-in-50">
              <Card>
                <CardContent className="space-y-4 pt-6">
                  <div className="space-y-1 mb-4">
                    <h3 className="text-lg font-medium leading-none tracking-tight">Social Profiles</h3>
                    <p className="text-sm text-muted-foreground">
                      Add your social media profiles. Enter a URL or username.
                    </p>
                  </div>

                  <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="social-links">
                      {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                          {data.socialLinks.map((link, index) => {
                            const platform = SOCIAL_PLATFORMS.find((p) => p.id === link.id);
                            return (
                              <Draggable key={link.id} draggableId={link.id} index={index}>
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className="flex items-center gap-2 bg-card border rounded-md p-1.5"
                                  >
                                    <div
                                      {...provided.dragHandleProps}
                                      className="cursor-grab text-muted-foreground hover:text-foreground px-1"
                                    >
                                      <GripVertical className="w-4 h-4" />
                                    </div>
                                    <div className="flex items-center justify-center w-8 h-8 rounded-md border bg-muted/20 text-muted-foreground shrink-0">
                                      {platform?.icon}
                                    </div>
                                    <Input
                                      placeholder={`${platform?.label} URL`}
                                      value={link.url}
                                      onChange={(e) =>
                                        updateSocialLink(link.id as SocialPlatform, "url", e.target.value)
                                      }
                                      className="flex-1 h-8 text-sm"
                                    />
                                  </div>
                                )}
                              </Draggable>
                            );
                          })}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>

        {/* Action Bar */}
        <div className="flex items-center gap-4 fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t p-4 lg:hidden z-50">
          <Button onClick={handleCopy} className="flex-1"><Copy className="w-4 h-4 mr-2" /> Copy</Button>
          <Button onClick={handleSave} variant="default" className="flex-1"><Save className="w-4 h-4 mr-2" /> Save</Button>
        </div>
      </div >

      {/* Preview Column */}
      < div className="xl:col-span-5" >
        <div className="sticky top-6 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold tracking-tight">Live Preview</h3>
            <div className="flex gap-2 w-full">
              <Button variant="outline" className="flex-1" onClick={handleCopy}>
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleSync}
                disabled={syncing}
              >
                {syncing ? <span className="animate-spin mr-2">⟳</span> : <span className="mr-2">G</span>}
                {syncing ? "Syncing..." : "Sync to Gmail"}
              </Button>
              <Button className="flex-1" onClick={handleSave} disabled={saving}>
                {saving ? <span className="animate-spin mr-2">⟳</span> : <Save className="w-4 h-4 mr-2" />}
                Save Profile
              </Button>
            </div>
          </div>
          <div className="rounded-xl border bg-white/5 backdrop-blur-sm p-8 shadow-2xl relative overflow-hidden group">
            {/* Glossy overlay effect for 'premium' feel */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />

            {/* The Preview container - Dark theme consistent */}
            <div className="bg-card border rounded-lg shadow-lg p-8 min-h-[300px] flex items-center justify-center transition-all overflow-hidden relative">
              {/* Simulating email client dark mode reading pane */}
              <div dangerouslySetInnerHTML={{ __html: generateHTML() }} className="w-full signature-preview-wrapper" />

              {/* Overlay to ensure clicks don't navigate away in preview */}
              <div className="absolute inset-0 z-10 pointer-events-none" />
            </div>

            <div className="absolute bottom-4 right-4 text-xs text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity">
              Responsive HTML Email Template
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-sm text-blue-400">
            <p className="font-semibold mb-1 flex items-center"><Check className="w-4 h-4 mr-2" /> Gmail Ready</p>
            After copying: Go to Gmail Settings &gt; General &gt; Signature. Paste the signature there and save changes.
          </div>
        </div>
      </div >
    </div >
  );
};

export default SignatureBuilder;
