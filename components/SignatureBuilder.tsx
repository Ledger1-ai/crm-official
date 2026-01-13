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
import { HexColorPicker } from "react-colorful";
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
  template: "professional" | "modern" | "minimalist" | "elegant" | "creative" | "banner" | "corporate" | "compact";
  socialLinks: SocialLink[];
  textColor: string;
  backgroundColor: string;
  highlightLastName: boolean;
  medallions: Medallion[];
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
  // Using a consistent set of icons. For X/Twitter we handle specifically in the loop if needed, 
  // but icon8 has a specific 'twitterx' or we can map 'twitter' to it if we want to force it globally.
  // For now, standard list.
  return `https://img.icons8.com/ios-filled/50/${hex}/${name}.png`;
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
    medallions: [],
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
      // Basic compression
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
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const blob: Blob = await new Promise((resolve) =>
          canvas.toBlob((b) => resolve(b!), file.type || "image/jpeg", 0.85)
        );

        const formData = new FormData();
        formData.append("file", new File([blob], file.name, { type: file.type }));

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
    } catch (e: any) {
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
      template, socialLinks, textColor, backgroundColor, highlightLastName, medallions
    } = data;

    const rgb = hexToRgb(accentColor);
    const textRgb = hexToRgb(textColor);

    const nameHtml = highlightLastName
      ? `${firstName} <span style="color: ${accentColor};">${lastName}</span>`
      : `${firstName} ${lastName}`;

    // Wrapper style for background color
    const wrapperStyle = `background-color: ${backgroundColor}; padding: 20px;`;
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
        case "twitter": iconUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/X_logo_2023_original.svg/50px-X_logo_2023_original.svg.png"; break; // Stable X logo
        case "facebook": iconUrl = "https://storage.googleapis.com/tgl_cdn/images/Social/icons8-facebook-50.png"; break;
        case "instagram": iconUrl = "https://storage.googleapis.com/tgl_cdn/images/Social/icons8-instagram-50.png"; break;
        case "medium": iconUrl = "https://storage.googleapis.com/tgl_cdn/images/Social/icons8-medium-50.png"; break;
        case "patreon": iconUrl = "https://storage.googleapis.com/tgl_cdn/images/Social/icons8-patreon-50.png"; break;
        case "youtube": iconUrl = "https://storage.googleapis.com/tgl_cdn/images/Social/YouTube.png"; break;
        case "discord": iconUrl = "https://storage.googleapis.com/tgl_cdn/images/Social/Discord-Symbol-Blurple.png"; break;
        default: iconUrl = "https://storage.googleapis.com/tgl_cdn/images/symbols/web.png"; // Fallback
      }

      return `
              <td style="padding-right: 6px;">
                <a href="${link.url}" target="_blank" style="text-decoration:none;">
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
                 <a href="${m.linkUrl || '#'}" style="text-decoration: none; cursor: ${m.linkUrl ? 'pointer' : 'default'};">
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
        <table cellpadding="0" cellspacing="0" border="0" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 800px; width: 100%;">
          <tr>
            <td style="padding: 16px; border-left: 4px solid ${accentColor}; background-color: rgba(${rgb}, 0.03);">

              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  ${showLeftColumn ? `
                  <td valign="top" style="padding-right: 20px; width: 100px;">
                    ${profileImage ? `<img src="${profileImage}" width="100" height="100" style="border-radius: 50%; width: 100px; height: 100px; object-fit: cover; display: block; margin-bottom: 12px;" alt="${firstName}" />` : ''}
                    
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
                          <td style="padding-bottom: 6px; vertical-align: middle;"><a href="tel:${phone}" style="color: inherit; text-decoration: none;">${phone}</a></td>
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
                          <td style="padding-bottom: 6px; vertical-align: middle;"><a href="https://${website}" style="color: inherit; text-decoration: none;">${website}</a></td>
                        </tr>
                      ` : ''}
                    </table>

                    ${socialHtml}

                  </td>
                </tr>
                </tr>
              </table>

              ${medallionsHtml}

            </td>
          </tr>
        </table>
        ${wrapperEnd}
      `;
    }

    // Template 2: Minimalist (Clean, no background)
    if (template === "minimalist") {
      return `
        ${wrapperStart}
        <table cellpadding="0" cellspacing="0" border="0" style="font-family: Helvetica, Arial, sans-serif; color: ${textColor};">
          <tr>
            ${profileImage ? `
              <td valign="top" style="padding-right: 12px;">
                <img src="${profileImage}" width="60" height="60" style="border-radius: 50%; width: 60px; height: 60px; object-fit: cover; display: block;" alt="${firstName}" />
              </td>
            ` : ''}
            <td valign="top" style="border-left: 1px solid #ddd; padding-left: 12px;">
              <div style="font-weight: bold; font-size: 16px;">${nameHtml}</div>
              <div style="font-size: 14px; color: rgba(${textRgb}, 0.7); margin-bottom: 6px;">${title}</div>

              <div style="font-size: 12px; line-height: 1.5;">
                ${phone ? `<div><img src="${getIconUrl('phone', accentColor)}" width="10" height="10" style="vertical-align: middle; margin-right: 4px;" /> ${phone}</div>` : ''}
                ${email ? `<div><img src="${getIconUrl('mail', accentColor)}" width="10" height="10" style="vertical-align: middle; margin-right: 4px;" /> <a href="mailto:${email}" style="color:inherit; text-decoration:none;">${email}</a></div>` : ''}
                ${website ? `<div><img src="${getIconUrl('globe', accentColor)}" width="10" height="10" style="vertical-align: middle; margin-right: 4px;" /> <a href="https://${website}" style="color:inherit; text-decoration:none;">${website}</a></div>` : ''}
              </div>

               ${socialHtml}

               ${medallionsHtml}
            </td>
          </tr>
        </table>
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
                <img src="${profileImage}" width="100" height="100" style="border-radius: 50%; width: 100px; height: 100px; object-fit: cover; display: block; margin-bottom: 16px; border: 4px solid #f7fafc;" alt="${firstName}" />
              ` : ''}
              <div style="font-size: 24px; font-weight: bold; color: ${textColor}; letter-spacing: 0.5px;">${nameHtml}</div>
              <div style="font-size: 14px; color: ${accentColor}; font-style: italic; margin-bottom: 16px;">${title} ${department ? `k &mdash; ${department}` : ''}</div>

              <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                ${phone ? `<tr><td style="padding: 2px 8px; font-size: 13px; color: rgba(${textRgb}, 0.8);"><img src="${getIconUrl('phone', accentColor)}" width="12" height="12" style="vertical-align: middle; margin-right: 6px;" /> ${phone}</td></tr>` : ''}
                ${email ? `<tr><td style="padding: 2px 8px; font-size: 13px; color: rgba(${textRgb}, 0.8);"><img src="${getIconUrl('mail', accentColor)}" width="12" height="12" style="vertical-align: middle; margin-right: 6px;" /> <a href="mailto:${email}" style="color: inherit; text-decoration: none;">${email}</a></td></tr>` : ''}
                ${website ? `<tr><td style="padding: 2px 8px; font-size: 13px; color: rgba(${textRgb}, 0.8);"><img src="${getIconUrl('globe', accentColor)}" width="12" height="12" style="vertical-align: middle; margin-right: 6px;" /> <a href="https://${website}" style="color: inherit; text-decoration: none;">${website}</a></td></tr>` : ''}
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
                <img src="${profileImage}" width="80" height="80" style="border-radius: 50%; width: 80px; height: 80px; object-fit: cover; display: block; margin: 0 auto 12px auto; border: 2px solid rgba(255,255,255,0.3);" alt="${firstName}" />
              ` : ''}
              <div style="font-size: 24px; color: #fff; font-weight: 900; line-height: 1;">${firstName.charAt(0)}${lastName.charAt(0)}</div>
            </td>
            <td valign="top" style="padding: 20px; border: 1px solid #e2e8f0; border-left: 0; border-radius: 0 12px 12px 0; background-color: #fff;">
              <h3 style="margin: 0; font-size: 20px; color: ${textColor};">${nameHtml}</h3>
              <div style="color: ${accentColor}; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">${title}</div>

              <div style="font-size: 13px; color: rgba(${textRgb}, 0.7); line-height: 1.6;">
                ${phone ? `<div style="display: flex; align-items: center; gap: 6px;"><img src="${getIconUrl('phone', accentColor)}" width="14" height="14" /> ${phone}</div>` : ''}
                ${email ? `<div style="display: flex; align-items: center; gap: 6px;"><img src="${getIconUrl('mail', accentColor)}" width="14" height="14" /> <a href="mailto:${email}" style="color: inherit; text-decoration: none;">${email}</a></div>` : ''}
                ${website ? `<div style="display: flex; align-items: center; gap: 6px;"><img src="${getIconUrl('globe', accentColor)}" width="14" height="14" /> <a href="https://${website}" style="color: inherit; text-decoration: none;">${website}</a></div>` : ''}
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
                   ${phone ? `<td style="padding-right: 12px; font-size: 13px; color: rgba(${textRgb}, 0.8);"><img src="${getIconUrl('phone', accentColor)}" width="11" height="11" style="vertical-align:middle; margin-right:4px;" /> ${phone}</td>` : ''}
                   ${email ? `<td style="padding-right: 12px; font-size: 13px; color: rgba(${textRgb}, 0.8);"><img src="${getIconUrl('mail', accentColor)}" width="11" height="11" style="vertical-align:middle; margin-right:4px;" /> <a href="mailto:${email}" style="color: inherit; text-decoration: none;">${email}</a></td>` : ''}
                 </tr>
                 <tr>
                   ${website ? `<td colspan="2" style="padding-top: 4px; font-size: 13px; color: rgba(${textRgb}, 0.8);"><img src="${getIconUrl('globe', accentColor)}" width="11" height="11" style="vertical-align:middle; margin-right:4px;" /> <a href="https://${website}" style="color: inherit; text-decoration: none;">${website}</a></td>` : ''}
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
                 <img src="${profileImage}" width="80" height="80" style="border-radius: 50%; width: 80px; height: 80px; object-fit: cover; display: block; margin-bottom: 12px;" />
              ` : ''}

              ${medallions && medallions.length > 0 ? `
                <div style="margin-top: 12px; text-align: center;">
                    ${medallions.map(m => `
                      <a href="${m.linkUrl || '#'}" style="text-decoration: none; cursor: ${m.linkUrl ? 'pointer' : 'default'};">
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
                 ${phone ? `<span><b style="color:${accentColor}">P:</b> ${phone}</span>` : ''}
                 ${email ? `<span><b style="color:${accentColor}">E:</b> <a href="mailto:${email}" style="color:inherit; text-decoration:none;">${email}</a></span>` : ''}
                 ${website ? `<span><b style="color:${accentColor}">W:</b> <a href="https://${website}" style="color:inherit; text-decoration:none;">${website}</a></span>` : ''}
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
              ${phone ? `<a href="tel:${phone}" style="color:inherit; text-decoration:none; margin-right: 8px;">${phone}</a>` : ''}
              ${email ? `<a href="mailto:${email}" style="color:inherit; text-decoration:none; margin-right: 8px;">${email}</a>` : ''}
              ${website ? `<a href="https://${website}" style="color:inherit; text-decoration:none;">${website}</a>` : ''}
           </div>
           <div style="margin-top: 6px;">${socialHtml}</div>
           ${medallionsHtml}
        </div>
        ${wrapperEnd}
      `;
    }

    // Template 3: Modern (Bottom bar)
    return `
      ${wrapperStart}
      <div style="font-family: sans-serif; max-width: 600px; width: 100%;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
           ${profileImage ? `<img src="${profileImage}" width="64" height="64" style="border-radius: 50%; width: 64px; height: 64px; object-fit: cover;" />` : ''}
           <div>
             <h2 style="margin: 0; font-size: 20px; font-weight: 800; color: ${textColor};">${nameHtml}</h2>
             <div style="font-size: 14px; color: ${accentColor}; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase;">${title}</div>
           </div>
        </div>

        <div style="border-top: 2px solid ${accentColor}; padding-top: 12px; display:flex; justify-content:space-between; flex-wrap:wrap;">
          <div style="font-size: 12px; color: rgba(${textRgb}, 0.8); line-height: 1.6;">
            ${phone ? `<div><img src="${getIconUrl('phone', accentColor)}" width="11" height="11" style="vertical-align:middle; margin-right:4px;" /> ${phone}</div>` : ''}
            ${email ? `<div><img src="${getIconUrl('mail', accentColor)}" width="11" height="11" style="vertical-align:middle; margin-right:4px;" /> ${email}</div>` : ''}
            ${website ? `<div><img src="${getIconUrl('globe', accentColor)}" width="11" height="11" style="vertical-align:middle; margin-right:4px;" /> ${website}</div>` : ''}
          </div>
          ${companyLogoUrl ? `<div><img src="${companyLogoUrl}" height="40" style="display:block;" /></div>` : ''}
        </div>

        ${socialHtml}
        ${medallionsHtml}
      </div>
      ${wrapperEnd}
    `;
  };

  // Handler: Save
  const handleSave = async () => {
    try {
      setSaving(true);
      const html = generateHTML();
      const payload = {
        signatureHtml: html,
        meta: data
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
      const blobText = new Blob([`${data.firstName} ${data.lastName} - ${data.title}`], { type: "text/plain" }); // Fallback plain

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
                    <div className="flex items-center justify-between">
                      <Label>Colors</Label>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={data.highlightLastName}
                          onCheckedChange={(c) => startUpdate("highlightLastName", c)}
                        />
                        <span className="text-xs text-muted-foreground">Highlight Last Name</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Accent Color */}
                      <div className="space-y-2">
                        <span className="text-xs text-muted-foreground">Accent</span>
                        <div className="flex items-center gap-2">
                          <Popover>
                            <PopoverTrigger asChild>
                              <div
                                className="w-10 h-8 rounded border cursor-pointer shadow-sm relative overflow-hidden"
                                style={{ backgroundColor: data.accentColor }}
                              />
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-3">
                              <HexColorPicker color={data.accentColor} onChange={(c) => startUpdate("accentColor", c)} />
                            </PopoverContent>
                          </Popover>
                          <Input value={data.accentColor} onChange={(e) => startUpdate("accentColor", e.target.value)} className="font-mono text-xs h-8" />
                        </div>
                      </div>

                      {/* Text Color */}
                      <div className="space-y-2">
                        <span className="text-xs text-muted-foreground">Text</span>
                        <div className="flex items-center gap-2">
                          <Popover>
                            <PopoverTrigger asChild>
                              <div
                                className="w-10 h-8 rounded border cursor-pointer shadow-sm relative overflow-hidden"
                                style={{ backgroundColor: data.textColor }}
                              />
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-3">
                              <HexColorPicker color={data.textColor} onChange={(c) => startUpdate("textColor", c)} />
                            </PopoverContent>
                          </Popover>
                          <Input value={data.textColor} onChange={(e) => startUpdate("textColor", e.target.value)} className="font-mono text-xs h-8" />
                        </div>
                      </div>
                    </div>

                    {/* Theme Colors Grid */}
                    <div className="flex gap-2 flex-wrap pt-2">
                      {THEME_COLORS.map(color => (
                        <div
                          key={color}
                          onClick={() => startUpdate("accentColor", color)}
                          className={`
                              w-5 h-5 rounded-full cursor-pointer hover:scale-110 transition-transform 
                              ${data.accentColor === color ? 'ring-2 ring-primary ring-offset-2' : ''}
                            `}
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>

                  <Separator />
                  <div className="space-y-3">
                    <Label>Background Color</Label>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Background Color */}
                      <div className="space-y-2">
                        <span className="text-xs text-muted-foreground">Background</span>
                        <div className="flex items-center gap-2">
                          <Popover>
                            <PopoverTrigger asChild>
                              <div
                                className="w-10 h-8 rounded border cursor-pointer shadow-sm relative overflow-hidden"
                                style={{ backgroundColor: data.backgroundColor }}
                              />
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 border-none">
                              <HexColorPicker color={data.backgroundColor} onChange={(c) => startUpdate("backgroundColor", c)} />
                              <div className="p-2 bg-popover border-t">
                                <Input
                                  value={data.backgroundColor}
                                  onChange={(e) => startUpdate("backgroundColor", e.target.value)}
                                  className="h-8"
                                />
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />
                  <div className="space-y-3">
                    <Label>Layout Template</Label>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {["professional", "modern", "minimalist", "elegant", "creative", "banner", "corporate", "compact"].map((t) => (
                        <div
                          key={t}
                          onClick={() => startUpdate("template", t as any)}
                          className={`
                             cursor-pointer rounded-lg border-2 p-3 text-center transition-all hover:bg-accent
                             ${data.template === t ? "border-primary bg-accent/50" : "border-border"}
                          `}
                        >
                          <div className="text-sm font-medium capitalize">{t}</div>
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
