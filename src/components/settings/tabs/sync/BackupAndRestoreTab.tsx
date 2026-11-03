/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2022 Vendicated and contributors
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

import { downloadSettingsBackup, uploadSettingsBackup } from "@api/SettingsSync/offline";
import { Card } from "@components/Card";
import { Flex } from "@components/Flex";
import { Heading } from "@components/Heading";
import { Paragraph } from "@components/Paragraph";
import { SettingsTab, wrapTab } from "@components/settings/tabs/BaseTab";
import { Margins } from "@utils/margins";
import { Button, Text, Forms, React, useEffect, useState } from "@webpack/common";

const BACKUP_BANNER_GIF = "https://i.pinimg.com/originals/6f/b2/d7/6fb2d7e574f85ab02ef9420b4e387552.gif";
const BACKUP_BG_GIF = "https://i.pinimg.com/originals/59/89/b7/5989b7149f2d899ac53c1078bdddc919.gif";

function BackupBannerCard() {
    const fullText1 = "2gv5cord Backup & Restore";
    const fullText2 = "Safely export or import your custom client settings, theme links, and plugin configurations.";

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
                    src={BACKUP_BANNER_GIF}
                    alt="Backup Banner"
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

function BackupAndRestoreTab() {
    return (
        <div style={{ position: "relative", minHeight: "100%", padding: "20px", borderRadius: "16px", overflow: "hidden" }}>
            <img
                src={BACKUP_BG_GIF}
                alt="Background"
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
                `}</style>

                <SettingsTab>
                    <BackupBannerCard />

                    <Flex flexDirection="column" gap="1em">
                        <Card variant="warning" style={{ background: "rgba(9, 9, 11, 0.85)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px" }}>
                            <Heading tag="h4" style={{ color: "#faa61a" }}>Warning</Heading>
                            <Paragraph style={{ color: "#a1a1aa" }}>Importing a settings file will overwrite your current settings.</Paragraph>
                        </Card>

                        <Card style={{ background: "rgba(9, 9, 11, 0.85)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "16px" }}>
                            <Text variant="text-md/normal" className={Margins.bottom8} style={{ color: "#e4e4e7" }}>
                                You can import and export your Vencord settings as a JSON file.
                                This allows you to easily transfer your settings to another device,
                                or recover your settings after reinstalling Vencord or Discord.
                            </Text>

                            <Heading tag="h4" style={{ color: "#fff", marginTop: "16px" }}>Settings Export contains:</Heading>
                            <Text variant="text-md/normal" className={Margins.bottom8} style={{ color: "#a1a1aa" }}>
                                <ul style={{ paddingLeft: "20px", marginTop: "8px" }}>
                                    <li>&mdash; Custom QuickCSS</li>
                                    <li>&mdash; Theme Links</li>
                                    <li>&mdash; Plugin Settings</li>
                                </ul>
                            </Text>

                            <Flex gap="1em" style={{ marginTop: "16px" }}>
                                <Button onClick={() => uploadSettingsBackup()} color={Button.Colors.BRAND}>
                                    Import Settings
                                </Button>
                                <Button onClick={downloadSettingsBackup} color={Button.Colors.GREEN}>
                                    Export Settings
                                </Button>
                            </Flex>
                        </Card>
                    </Flex>
                </SettingsTab >
            </div>
        </div>
    );
}

export default wrapTab(BackupAndRestoreTab, "Backup & Restore");