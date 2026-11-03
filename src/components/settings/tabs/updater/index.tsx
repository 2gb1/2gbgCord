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

import { useSettings } from "@api/Settings";
import { Button } from "@components/Button";
import { Card } from "@components/Card";
import { Divider } from "@components/Divider";
import { Flex } from "@components/Flex";
import { FormSwitch } from "@components/FormSwitch";
import { HeadingSecondary } from "@components/Heading";
import { Link } from "@components/Link";
import { Paragraph } from "@components/Paragraph";
import { SettingsTab, wrapTab } from "@components/settings/tabs/BaseTab";
import { Margins } from "@utils/margins";
import { classes } from "@utils/misc";
import { useAwaiter } from "@utils/react";
import { getRepo, isNewer, UpdateLogger } from "@utils/updater";
import { Forms, React, useEffect, useState } from "@webpack/common";

import gitHash from "~git-hash";

import { CommonProps, HashLink, Newer, Updatable } from "./Components";

const UPDATER_BANNER_GIF = "https://i.pinimg.com/originals/a9/ea/79/a9ea79bd2acb36e1e31d2b40c15f7b05.gif";
const UPDATER_BG_GIF = "https://i.pinimg.com/originals/59/89/b7/5989b7149f2d899ac53c1078bdddc919.gif";

function UpdaterBannerCard() {
    const fullText1 = "2gv5cord GitHub Updater";
    const fullText2 = "Synchronize your client builds in real-time directly with your GitHub repository.";

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
                    src={UPDATER_BANNER_GIF}
                    alt="Updater Banner"
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

function VesktopSection() {
    if (!IS_VESKTOP) return null;

    const [isVesktopOutdated] = useAwaiter<boolean>(VesktopNative.app.isOutdated, { fallbackValue: false });

    return (
        <Flex className={Margins.bottom20} flexDirection="column" gap="1em">
            <Card variant="info" style={{ background: "rgba(9, 9, 11, 0.85)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <HeadingSecondary style={{ color: "#fff" }}>Vesktop & Vencord</HeadingSecondary>
                <Paragraph style={{ color: "#a1a1aa" }}>Vesktop and Vencord are two separate things. This updater is for Vencord.</Paragraph>
                <Paragraph className={Margins.top8} style={{ color: "#a1a1aa" }}>
                    You receive separate popups for Vesktop updates. You can also manually update by installing the <Link href="https://vesktop.dev/install">latest version</Link>.
                </Paragraph>
            </Card>

            {isVesktopOutdated && (
                <Card variant="warning" style={{ background: "rgba(9, 9, 11, 0.85)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <HeadingSecondary style={{ color: "#fff" }}>Vesktop Outdated</HeadingSecondary>
                    <Flex flexDirection="column" gap="0.5em">
                        <Paragraph style={{ color: "#a1a1aa" }}>Your version of Vesktop is outdated!</Paragraph>
                        <Button variant="link" onClick={() => VesktopNative.app.openUpdater()}>Open Vesktop Updater</Button>
                    </Flex>
                </Card>
            )}
        </Flex>
    );
}

function Updater() {
    const settings = useSettings(["autoUpdate", "autoUpdateNotification"]);

    const [repo, err, repoPending] = useAwaiter(getRepo, {
        fallbackValue: "Loading...",
        onError: e => UpdateLogger.error("Failed to retrieve repo", err)
    });

    const commonProps: CommonProps = {
        repo,
        repoPending
    };

    return (
        <div style={{ position: "relative", minHeight: "100%", padding: "20px", borderRadius: "16px", overflow: "hidden" }}>
            <img
                src={UPDATER_BG_GIF}
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
                    <UpdaterBannerCard />
                    <VesktopSection />

                    <div className="vc-settings-switches" style={{ background: "rgba(9, 9, 11, 0.85)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
                        <FormSwitch
                            title="Automatically update"
                            description="Automatically update Vencord without confirmation prompt"
                            value={settings.autoUpdate}
                            onChange={(v: boolean) => settings.autoUpdate = v}
                            hideBorder
                        />
                        <FormSwitch
                            title="Get notified when an automatic update completes"
                            description="Show a notification when Vencord automatically updates"
                            value={settings.autoUpdateNotification}
                            onChange={(v: boolean) => settings.autoUpdateNotification = v}
                            disabled={!settings.autoUpdate}
                            hideBorder
                        />
                    </div>

                    <Card style={{ background: "rgba(9, 9, 11, 0.85)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", marginBottom: "16px" }}>
                        <Forms.FormTitle tag="h5" className={Margins.top20} style={{ color: "#fff" }}>Repo</Forms.FormTitle>

                        <Forms.FormText style={{ color: "#3ba55d", fontFamily: "monospace" }}>
                            {repoPending
                                ? repo
                                : err
                                    ? "Failed to retrieve - check console"
                                    : (
                                        <Link href={repo}>
                                            {repo.split("/").slice(-2).join("/")}
                                        </Link>
                                    )
                            }
                            {" "}
                            (<HashLink hash={gitHash} repo={repo} disabled={repoPending} />)
                        </Forms.FormText>
                    </Card>

                    <Divider className={classes(Margins.top16, Margins.bottom16)} style={{ borderColor: "rgba(255,255,255,0.1)" }} />

                    <Card style={{ background: "rgba(9, 9, 11, 0.85)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px" }}>
                        <Forms.FormTitle tag="h5" style={{ color: "#fff" }}>Updates</Forms.FormTitle>

                        {isNewer
                            ? <Newer {...commonProps} />
                            : <Updatable {...commonProps} />
                        }
                    </Card>
                </SettingsTab>
            </div>
        </div>
    );
}

export default IS_UPDATER_DISABLED
    ? null
    : wrapTab(Updater, "Updater");