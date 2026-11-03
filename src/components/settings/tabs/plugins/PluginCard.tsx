/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { showNotice } from "@api/Notices";
import { hasAnyVisibleSettings, isPluginEnabled, pluginRequiresRestart, startDependenciesRecursive, startPlugin, stopPlugin } from "@api/PluginManager";
import { Settings } from "@api/Settings";
import { CogWheel, InfoIcon } from "@components/Icons";
import { AddonCard } from "@components/settings/AddonCard";
import { Plugin } from "@utils/types";
import { React, showToast } from "@webpack/common";

import { cl, logger } from ".";
import { openPluginModal } from "./PluginModal";

interface PluginCardProps extends React.HTMLProps<HTMLDivElement> {
    plugin: Plugin;
    disabled: boolean;
    onRestartNeeded(name: string, key: string): void;
    isNew?: boolean;
}

// رابط الـ GIF اللي بيكون داخل كل بطاقة تحت الوصف
const CARD_BOTTOM_GIF = "https://i.pinimg.com/originals/b8/71/76/b8717641f46cdfdced2c86e984f07c11.gif";

export function PluginCard({ plugin, disabled, onRestartNeeded, onMouseEnter, onMouseLeave, isNew }: PluginCardProps) {
    const settings = Settings.plugins[plugin.name];

    const isEnabled = () => isPluginEnabled(plugin.name);

    function toggleEnabled() {
        const wasEnabled = isEnabled();

        // If we're enabling a plugin, make sure all deps are enabled recursively.
        if (!wasEnabled) {
            const { restartNeeded, failures } = startDependenciesRecursive(plugin);

            if (failures.length) {
                logger.error(`Failed to start dependencies for ${plugin.name}: ${failures.join(", ")}`);
                showNotice("Failed to start dependencies: " + failures.join(", "), "Close", () => null);
                return;
            }

            if (restartNeeded) {
                // If any dependencies have patches, don't start the plugin yet.
                settings.enabled = true;
                onRestartNeeded(plugin.name, "enabled");
                return;
            }
        }

        // if the plugin requires a restart, don't use stopPlugin/startPlugin. Wait for restart to apply changes.
        if (pluginRequiresRestart(plugin)) {
            settings.enabled = !wasEnabled;
            onRestartNeeded(plugin.name, "enabled");
            return;
        }

        // If the plugin is enabled, but hasn't been started, then we can just toggle it off.
        if (wasEnabled && !plugin.started) {
            settings.enabled = !wasEnabled;
            return;
        }

        const result = wasEnabled ? stopPlugin(plugin) : startPlugin(plugin);

        if (!result) {
            settings.enabled = false;

            const msg = `Error while ${wasEnabled ? "stopping" : "starting"} plugin ${plugin.name}`;
            showToast({ text: msg, variant: "critical", position: "bottom" });

            return;
        }

        settings.enabled = !wasEnabled;
    }

    return (
        <AddonCard
            name={plugin.name}
            // هنا الحركة الخرافية: دمجنا الوصف الأصلي مع الـ GIF والخط الفاصل وأنيميشن رهيب
            description={
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "4px" }}>
                    <span style={{ color: "#a1a1aa", lineHeight: "1.4" }}>
                        {plugin.description}
                    </span>
                    <div
                        style={{
                            marginTop: "6px",
                            paddingTop: "12px",
                            borderTop: "1px solid rgba(255, 255, 255, 0.08)", // الخط الفاصل الخفيف
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            overflow: "hidden",
                            borderRadius: "6px"
                        }}
                    >
                        <img
                            src={CARD_BOTTOM_GIF}
                            alt="2gv5cord Line"
                            style={{
                                width: "100%",
                                height: "22px", // الارتفاع المناسب عشان يكون زي الخط
                                objectFit: "cover",
                                opacity: 0.6,
                                filter: "contrast(1.2)",
                                transition: "all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)", // حركة ناعمة جداً
                                transform: "scale(1)"
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.opacity = "1";
                                e.currentTarget.style.transform = "scale(1.03)";
                                e.currentTarget.style.filter = "contrast(1.5) drop-shadow(0 0 8px rgba(255,255,255,0.3))";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.opacity = "0.6";
                                e.currentTarget.style.transform = "scale(1)";
                                e.currentTarget.style.filter = "contrast(1.2)";
                            }}
                        />
                    </div>
                </div>
            }
            isNew={isNew}
            enabled={isEnabled()}
            setEnabled={toggleEnabled}
            disabled={disabled}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            infoButton={
                <button
                    role="switch"
                    onClick={() => openPluginModal(plugin, onRestartNeeded)}
                    className={cl("info-button")}
                    style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        transition: "all 0.3s ease", // أنيميشن دوران وتكبير
                        transform: "rotate(0deg) scale(1)",
                        color: "#a1a1aa",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "4px"
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "rotate(90deg) scale(1.15)";
                        e.currentTarget.style.color = "#ffffff";
                        e.currentTarget.style.filter = "drop-shadow(0 0 5px rgba(255,255,255,0.5))";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "rotate(0deg) scale(1)";
                        e.currentTarget.style.color = "#a1a1aa";
                        e.currentTarget.style.filter = "none";
                    }}
                    onMouseDown={(e) => {
                        e.currentTarget.style.transform = "rotate(90deg) scale(0.95)"; // تأثير الضغطة
                    }}
                    onMouseUp={(e) => {
                        e.currentTarget.style.transform = "rotate(90deg) scale(1.15)";
                    }}
                >
                    {hasAnyVisibleSettings(plugin)
                        ? <CogWheel className={cl("info-icon")} />
                        : <InfoIcon className={cl("info-icon")} />
                    }
                </button>
            }
        />
    );
}