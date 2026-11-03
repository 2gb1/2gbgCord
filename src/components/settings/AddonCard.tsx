/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import "./AddonCard.css";

import { AddonBadge } from "@components/settings/PluginBadge";
import { Switch } from "@components/Switch";
import { classNameFactory } from "@utils/css";
import { Text, useRef, useState } from "@webpack/common";
import type { MouseEventHandler, ReactNode } from "react";

const cl = classNameFactory("vc-addon-");

interface Props {
    name: ReactNode;
    description: ReactNode;
    enabled: boolean;
    setEnabled: (enabled: boolean) => void;
    disabled?: boolean;
    isNew?: boolean;
    onMouseEnter?: MouseEventHandler<HTMLDivElement>;
    onMouseLeave?: MouseEventHandler<HTMLDivElement>;

    infoButton?: ReactNode;
    footer?: ReactNode;
    author?: ReactNode;
}

const CARD_BACKGROUND_GIF = "https://i.pinimg.com/originals/b8/71/76/b8717641f46cdfdced2c86e984f07c11.gif";

export function AddonCard({ disabled, isNew, name, infoButton, footer, author, enabled, setEnabled, description, onMouseEnter, onMouseLeave }: Props) {
    const titleRef = useRef<HTMLDivElement>(null);
    const titleContainerRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            className={cl("card", { "card-disabled": disabled })}
            style={{
                position: "relative",
                overflow: "hidden",
                border: "1px solid",
                borderColor: isHovered ? "rgba(255, 255, 255, 0.4)" : "rgba(255, 255, 255, 0.15)",
                borderRadius: "12px",
                boxShadow: isHovered ? "0 12px 30px rgba(0, 0, 0, 0.9)" : "0 6px 20px rgba(0, 0, 0, 0.5)",
                transform: isHovered ? "translateY(-4px)" : "translateY(0)",
                transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
                display: "flex",
                flexDirection: "column",
                // لون ثابت أنيق يحمي شكل البطاقة لما يكون الـ GIF طافي
                backgroundColor: "rgba(12, 12, 14, 0.95)",
                "--background-secondary": "transparent",
                "--background-tertiary": "transparent",
                "--background-primary": "transparent",
            } as any}
            onMouseEnter={(e) => {
                setIsHovered(true);
                if (onMouseEnter) onMouseEnter(e);
            }}
            onMouseLeave={(e) => {
                setIsHovered(false);
                if (onMouseLeave) onMouseLeave(e);
            }}
        >
            {/* 
              خدعة تفريغ الرام:
              الصورة ما راح تنكتب في الكود نهائياً إلا إذا كان الماوس فوقها (isHovered == true)
            */}
            {isHovered && (
                <img
                    src={CARD_BACKGROUND_GIF}
                    alt="bg"
                    style={{
                        position: "absolute",
                        top: 0, left: 0, right: 0, bottom: 0,
                        width: "100%", height: "100%",
                        objectFit: "cover",
                        zIndex: 0,
                        opacity: 0.9,
                        transform: "scale(1.05)",
                        pointerEvents: "none"
                    }}
                />
            )}

            <div style={{
                position: "absolute",
                top: 0, left: 0, right: 0, bottom: 0,
                background: "linear-gradient(to right, rgba(5, 5, 8, 0.95) 0%, rgba(5, 5, 8, 0.3) 100%)",
                zIndex: 1,
                pointerEvents: "none"
            }} />

            {/* المحتوى */}
            <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", height: "100%" }}>

                {/* الهيدر */}
                <div className={cl("header")} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.15)", paddingBottom: "12px", marginBottom: "12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>

                    <div className={cl("name-author")} style={{ flex: 1 }}>
                        <Text variant="text-md/bold" className={cl("name")}>
                            <div ref={titleContainerRef} className={cl("title-container")}>
                                <div
                                    ref={titleRef}
                                    className={cl("title")}
                                    style={{ color: "#ffffff", fontWeight: "900", letterSpacing: "0.5px", textShadow: "0 2px 6px rgba(0,0,0,0.9)" }}
                                    onMouseOver={() => {
                                        const title = titleRef.current!;
                                        const titleContainer = titleContainerRef.current!;
                                        title.style.setProperty("--offset", `${titleContainer.clientWidth - title.scrollWidth}px`);
                                        title.style.setProperty("--duration", `${Math.max(0.5, (title.scrollWidth - titleContainer.clientWidth) / 7)}s`);
                                    }}
                                >
                                    {name}
                                </div>
                            </div>
                            {isNew && <AddonBadge text="NEW" color="#ED4245" />}
                        </Text>

                        {!!author && (
                            <Text variant="text-md/normal" className={cl("author")} style={{ color: "#b9bbbe", fontWeight: "600", textShadow: "0 1px 4px rgba(0,0,0,0.9)" }}>
                                {author}
                            </Text>
                        )}
                    </div>

                    {/* منطقة شارة VO والإعدادات */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{
                            color: "#ff1a1a",
                            WebkitTextStroke: "1.2px #000000",
                            fontSize: "20px",
                            fontWeight: 900,
                            fontFamily: "Impact, 'Arial Black', sans-serif",
                            fontStyle: "italic",
                            letterSpacing: "1px",
                            filter: "drop-shadow(1px 2px 2px rgba(0,0,0,0.8))",
                            userSelect: "none"
                        }}>VO</span>

                        {infoButton}

                        <Switch
                            checked={enabled}
                            onChange={setEnabled}
                            disabled={disabled}
                        />
                    </div>
                </div>

                {/* نص الوصف مع تأثير الآلة الكاتبة */}
                <Text
                    className={cl("note")}
                    variant="text-sm/normal"
                    style={{
                        color: "#e4e4e7",
                        lineHeight: "1.5",
                        fontWeight: "500",
                        textShadow: "0 1px 4px rgba(0,0,0,0.9)",
                        WebkitMaskImage: "linear-gradient(to right, black 50%, transparent 50%)",
                        WebkitMaskSize: "200% 100%",
                        WebkitMaskPosition: isHovered ? "0% 0" : "100% 0",
                        transition: isHovered ? "mask-position 1.2s steps(50)" : "none",
                        opacity: isHovered ? 1 : 0.4
                    }}
                >
                    {description}
                </Text>

                {footer && (
                    <div style={{ marginTop: "12px" }}>
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}