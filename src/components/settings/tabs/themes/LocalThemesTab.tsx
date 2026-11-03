/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { isPluginEnabled } from "@api/PluginManager";
import { Settings, useSettings } from "@api/Settings";
import { Card } from "@components/Card";
import { Flex } from "@components/Flex";
import { FolderIcon, PaintbrushIcon, PencilIcon, PlusIcon, RestartIcon } from "@components/Icons";
import { Link } from "@components/Link";
import { Margins } from "@components/margins";
import { QuickAction, QuickActionCard } from "@components/settings/QuickAction";
import { openPluginModal } from "@components/settings/tabs/plugins/PluginModal";
import { UserThemeHeader } from "@main/themes";
import ClientThemePlugin from "@plugins/clientTheme";
import { classNameFactory } from "@utils/css";
import { findLazy } from "@webpack";
import { Forms, useEffect, useRef, useState } from "@webpack/common";
import type { ComponentType, Ref, SyntheticEvent } from "react";

import { ThemeCard } from "./ThemeCard";

const cl = classNameFactory("vc-settings-theme-");

const THEMES_BG_GIF = "https://i.pinimg.com/originals/59/89/b7/5989b7149f2d899ac53c1078bdddc919.gif";
const THEMES_BANNER_GIF = "https://i.pinimg.com/originals/0e/98/44/0e9844465b3cdce0a0611850a07b7457.gif";

type FileInput = ComponentType<{
    ref: Ref<HTMLInputElement>;
    onChange: (e: SyntheticEvent<HTMLInputElement>) => void;
    multiple?: boolean;
    filters?: { name?: string; extensions: string[]; }[];
}>;

const FileInput: FileInput = findLazy(m => m.prototype?.activateUploadDialogue && m.prototype.setRef);

function ThemesBannerCard() {
    const fullText1 = "2gv5cord Theme Customization";
    const fullText2 = "Manage your local custom styles and aesthetic themes with high-end dark visuals.";

    const [typedText1, setTypedText1] = useState("");
    const [typedText2, setTypedText2] = useState("");

    useEffect(() => {
        let i = 0;
        let j = 0;
        setTypedText1("");
        setTypedText2("");

        const timer1 = setInterval(() => {
            if (i < fullText1.length) {
                setTypedText1(fullText1.substring(0, i + 1));
                i++;
            } else {
                clearInterval(timer1);
                const timer2 = setInterval(() => {
                    if (j < fullText2.length) {
                        setTypedText2(fullText2.substring(0, j + 1));
                        j++;
                    } else {
                        clearInterval(timer2);
                    }
                }, 20);
            }
        }, 30);

        return () => clearInterval(timer1);
    }, []);

    return (
        <div style={{
            background: "linear-gradient(90deg, #111115 0%, #09090b 100%)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            borderRadius: "12px",
            padding: "20px 24px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.6)"
        }}>
            <div style={{ flex: 1, paddingRight: "16px" }}>
                <Forms.FormTitle tag="h5" style={{ color: "#ffffff", fontSize: "18px", fontWeight: "bold", minHeight: "24px" }}>
                    {typedText1}
                    <span style={{ borderRight: "2px solid #fff", animation: "blink 0.7s infinite" }} />
                </Forms.FormTitle>
                <Forms.FormText style={{ color: "#a1a1aa", marginTop: "8px", fontSize: "14px", lineHeight: "1.5" }}>
                    {typedText2}
                </Forms.FormText>
            </div>
            <div>
                <img
                    src={THEMES_BANNER_GIF}
                    alt="Banner"
                    style={{
                        width: "80px", height: "80px", borderRadius: "12px", objectFit: "cover",
                        border: "1px solid rgba(255, 255, 255, 0.2)", boxShadow: "0 4px 15px rgba(0, 0, 0, 0.5)",
                        transition: "transform 0.3s ease"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.08)"}
                    onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                />
            </div>
        </div>
    );
}

function onLocalThemeChange(fileName: string, value: boolean) {
    if (value) {
        if (Settings.enabledThemes.includes(fileName)) return;
        Settings.enabledThemes = [...Settings.enabledThemes, fileName];
    } else {
        Settings.enabledThemes = Settings.enabledThemes.filter(f => f !== fileName);
    }
}

async function doUploadThemes(files: ArrayLike<File>) {
    const uploads = Array.from(files, file => {
        const { name } = file;
        if (!name.endsWith(".css")) return;

        return new Promise<void>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                VencordNative.themes.uploadTheme(name, reader.result as string)
                    .then(resolve)
                    .catch(reject);
            };
            reader.readAsText(file);
        });
    });
    await Promise.all(uploads);
}

async function onFileUpload(e: SyntheticEvent<HTMLInputElement>) {
    e.stopPropagation();
    e.preventDefault();
    if (!e.currentTarget?.files?.length) return;
    await doUploadThemes(e.currentTarget.files);
}

function useDropFile(refreshThemes: Function) {
    useEffect(() => {
        const onDragOver = (e: DragEvent) => {
            if (!e.dataTransfer?.items.length) return;
            if (!Array.from(e.dataTransfer.items).some(item => item.kind === "file" && item.getAsFile()?.name.endsWith(".css")))
                return;
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
        };
        const onDrop = async (e: DragEvent) => {
            e.preventDefault();
            if (!e.dataTransfer?.files.length) return;
            await doUploadThemes(Array.from(e.dataTransfer.files).filter(file => file.name.endsWith(".css")));
            refreshThemes();
        };
        window.addEventListener("dragover", onDragOver);
        window.addEventListener("drop", onDrop);
        return () => {
            window.removeEventListener("dragover", onDragOver);
            window.removeEventListener("drop", onDrop);
        };
    }, []);
}

export function LocalThemesTab() {
    const settings = useSettings(["enabledThemes"]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [userThemes, setUserThemes] = useState<UserThemeHeader[] | null>(null);

    useEffect(() => {
        refreshLocalThemes();
    }, []);

    if (IS_WEB) useDropFile(refreshLocalThemes);

    async function refreshLocalThemes() {
        const themes = await VencordNative.themes.getThemesList();
        setUserThemes(themes);
    }

    return (
        <div style={{ position: "relative", minHeight: "100%", padding: "20px", borderRadius: "16px", overflow: "hidden" }}>
            <img
                src={THEMES_BG_GIF}
                alt="Themes Background"
                style={{
                    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                    width: "100%", height: "100%", objectFit: "cover", zIndex: 0, opacity: 0.35, pointerEvents: "none"
                }}
            />
            <div style={{
                position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                background: "linear-gradient(to bottom, rgba(5,5,8,0.85) 0%, rgba(5,5,8,0.95) 100%)",
                zIndex: 1, pointerEvents: "none"
            }} />

            <div style={{ position: "relative", zIndex: 2 }}>
                <style>{`
                    @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
                    .vc-settings-theme-grid > * {
                        background: linear-gradient(145deg, #09090b 0%, #121216 100%) !important;
                        border: 1px solid rgba(255, 255, 255, 0.1) !important;
                        border-radius: 12px !important;
                        transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
                    }
                    .vc-settings-theme-grid > *:hover {
                        transform: translateY(-4px) !important;
                        border-color: rgba(255, 255, 255, 0.3) !important;
                        box-shadow: 0 12px 25px rgba(0, 0, 0, 0.8) !important;
                    }
                `}</style>

                <ThemesBannerCard />

                <Card style={{ background: "rgba(9, 9, 11, 0.85)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", marginBottom: "16px" }}>
                    <Forms.FormTitle tag="h5" style={{ color: "#fff" }}>Find Themes:</Forms.FormTitle>
                    <Flex gap="0.4em" flexDirection="column" justifyContent="flex-start" className={Margins.bottom8}>
                        <span>&ndash; <Link href="https://betterdiscord.app/themes">BetterDiscord theme list</Link></span>
                        <span>&ndash; <Link href="https://github.com/search?q=discord+theme">GitHub</Link></span>
                    </Flex>
                    <Forms.FormText style={{ color: "#a1a1aa" }}>If using the BD site, click on "Download" and place the downloaded .theme.css file into your themes folder.</Forms.FormText>
                </Card>

                <Card style={{ background: "rgba(9, 9, 11, 0.85)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", marginBottom: "16px" }}>
                    <Forms.FormTitle tag="h5" style={{ color: "#fff" }}>External Resources</Forms.FormTitle>
                    <Forms.FormText style={{ color: "#a1a1aa" }}>For security reasons, loading resources (styles, fonts, images, ...) from most sites is blocked.</Forms.FormText>
                    <Forms.FormText style={{ color: "#a1a1aa" }}>Make sure all your assets are hosted on GitHub, GitLab, Codeberg, Imgur, Discord or Google Fonts.</Forms.FormText>
                </Card>

                <section>
                    <Forms.FormTitle tag="h5" style={{ color: "#fff", marginBottom: "12px" }}>Local Themes</Forms.FormTitle>
                    <div style={{ background: "rgba(9, 9, 11, 0.85)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", overflow: "hidden" }}>
                        <QuickActionCard>
                            <>
                                {IS_WEB ?
                                    (
                                        <QuickAction
                                            text={
                                                <span>
                                                    Upload Theme
                                                    <FileInput
                                                        ref={fileInputRef}
                                                        onChange={async e => {
                                                            await onFileUpload(e);
                                                            refreshLocalThemes();
                                                        }}
                                                        multiple={true}
                                                        filters={[{ extensions: ["css"] }]}
                                                    />
                                                </span>
                                            }
                                            Icon={PlusIcon}
                                            style={{ position: "relative" }}
                                        />
                                    ) : (
                                        <QuickAction
                                            text="Open Themes Folder"
                                            action={() => VencordNative.themes.openFolder()}
                                            Icon={FolderIcon}
                                        />
                                    )}
                                <QuickAction
                                    text="Load missing Themes"
                                    action={refreshLocalThemes}
                                    Icon={RestartIcon}
                                />
                                <QuickAction
                                    text="Edit QuickCSS"
                                    action={() => VencordNative.quickCss.openEditor()}
                                    Icon={PaintbrushIcon}
                                />

                                {isPluginEnabled(ClientThemePlugin.name) && (
                                    <QuickAction
                                        text="Edit ClientTheme"
                                        action={() => openPluginModal(ClientThemePlugin)}
                                        Icon={PencilIcon}
                                    />
                                )}
                            </>
                        </QuickActionCard>
                    </div>

                    <div className={cl("grid")} style={{ marginTop: "16px" }}>
                        {userThemes?.map(theme => (
                            <ThemeCard
                                key={theme.fileName}
                                enabled={settings.enabledThemes.includes(theme.fileName)}
                                onChange={enabled => onLocalThemeChange(theme.fileName, enabled)}
                                onDelete={async () => {
                                    onLocalThemeChange(theme.fileName, false);
                                    await VencordNative.themes.deleteTheme(theme.fileName);
                                    refreshLocalThemes();
                                }}
                                theme={theme}
                            />
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}