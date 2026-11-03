/*
 * Vencord, a modification for Discord's desktop app
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

import { useSettings } from "@api/Settings";
import { authorizeCloud, deauthorizeCloud } from "@api/SettingsSync/cloudSetup";
import { deleteCloudSettings, eraseAllCloudData, getCloudSettings, getCloudSyncDirection, putCloudSettings, setCloudSyncDirection } from "@api/SettingsSync/cloudSync";
import { BaseText } from "@components/BaseText";
import { Button, ButtonProps } from "@components/Button";
import { CheckedTextInput } from "@components/CheckedTextInput";
import { Divider } from "@components/Divider";
import { Flex } from "@components/Flex";
import { FormSwitch } from "@components/FormSwitch";
import { Grid } from "@components/Grid";
import { Heading } from "@components/Heading";
import { CloudDownloadIcon, CloudUploadIcon, DeleteIcon, RestartIcon } from "@components/Icons";
import { Link } from "@components/Link";
import { Paragraph } from "@components/Paragraph";
import { SettingsTab, wrapTab } from "@components/settings/tabs/BaseTab";
import { Margins } from "@utils/margins";
import { classes } from "@utils/misc";
import { IconComponent } from "@utils/types";
import { ConfirmModal, openModal, Select, Tooltip, Forms, React, useEffect, useState } from "@webpack/common";

const CLOUD_BANNER_GIF = "https://i.pinimg.com/originals/64/df/cc/64dfcc79bfc3d2243402b5628ad89c03.gif";
const CLOUD_BG_GIF = "https://i.pinimg.com/originals/59/89/b7/5989b7149f2d899ac53c1078bdddc919.gif";

function CloudBannerCard() {
    const fullText1 = "2gv5cord Cloud Sync";
    const fullText2 = "Securely synchronize and back up your client settings across all your devices in real-time.";

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
                    src={CLOUD_BANNER_GIF}
                    alt="Cloud Banner"
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

function validateUrl(url: string) {
    try {
        new URL(url);
        return true;
    } catch {
        return "Invalid URL";
    }
}

const SectionHeading = ({ text }: { text: string; }) => (
    <BaseText
        tag="h5"
        size="lg"
        weight="semibold"
        className={Margins.bottom16}
        style={{ color: "#fff" }}
    >
        {text}
    </BaseText>
);

function ButtonWithIcon({ children, Icon, className, ...buttonProps }: ButtonProps & { Icon: IconComponent; }) {
    return (
        <Button {...buttonProps} className={classes("vc-cloud-icon-with-button", className)}>
            <Icon className={"vc-cloud-button-icon"} />
            {children}
        </Button>
    );
}

function CloudSetupSection() {
    const { cloud } = useSettings(["cloud.authenticated", "cloud.url"]);

    return (
        <section style={{ background: "rgba(9, 9, 11, 0.85)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "16px" }}>
            <SectionHeading text="Cloud Integrations" />

            <Paragraph size="md" className={Margins.bottom20} style={{ color: "#a1a1aa" }}>
                Vencord comes with a cloud integration that adds goodies like settings sync across devices.
                It <Link href="https://vencord.dev/cloud/privacy">respects your privacy</Link>, and
                the <Link href="https://github.com/Vencord/Backend">source code</Link> is AGPL 3.0 licensed so you
                can host it yourself.
            </Paragraph>
            <FormSwitch
                key="backend"
                title="Enable Cloud Integrations"
                description="This will request authorization if you have not yet set up cloud integrations."
                value={cloud.authenticated}
                onChange={v => {
                    if (v)
                        authorizeCloud();
                    else
                        cloud.authenticated = v;
                }}
            />
            <Heading tag="h5" className={Margins.top16} style={{ color: "#fff" }}>Backend URL</Heading>
            <Paragraph className={Margins.bottom8} style={{ color: "#a1a1aa" }}>
                Which backend to use when using cloud integrations.
            </Paragraph>
            <CheckedTextInput
                key="backendUrl"
                initialValue={cloud.url}
                onChange={async v => {
                    cloud.url = v;
                    cloud.authenticated = false;
                    deauthorizeCloud();
                }}
                validate={validateUrl}
            />

            <Grid columns={1} gap="1em" className={Margins.top8}>
                <ButtonWithIcon
                    variant="primary"
                    disabled={!cloud.authenticated}
                    onClick={async () => {
                        await deauthorizeCloud();
                        cloud.authenticated = false;
                        await authorizeCloud();
                    }}
                    Icon={RestartIcon}
                >
                    Reauthorise
                </ButtonWithIcon>
            </Grid>
        </section>
    );
}

function SettingsSyncSection() {
    const { cloud } = useSettings(["cloud.authenticated", "cloud.settingsSync"]);
    const [syncDirection, setSyncDirection] = useState(getCloudSyncDirection);
    const sectionEnabled = cloud.authenticated && cloud.settingsSync;

    return (
        <section style={{ background: "rgba(9, 9, 11, 0.85)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "16px" }}>
            <SectionHeading text="Settings Sync" />
            <Flex flexDirection="column" gap="1em">
                <FormSwitch
                    key="cloud-sync"
                    title="Enable Settings Sync"
                    description="Save your Vencord settings to the cloud so you can easily keep them the same on all your devices"
                    value={cloud.settingsSync}
                    onChange={v => { cloud.settingsSync = v; }}
                    disabled={!cloud.authenticated}
                    hideBorder
                />

                <div>
                    <Heading tag="h5" style={{ color: "#fff" }}>
                        Sync Rules for This Device
                    </Heading>
                    <Paragraph className={Margins.bottom8} style={{ color: "#a1a1aa" }}>
                        This setting controls how settings move between <strong>this device</strong> and the cloud.
                        You can let changes flow both ways, or choose one place to be the main source of truth.
                    </Paragraph>
                    <Select
                        options={[
                            {
                                label: "Two-way sync (changes go both directions)",
                                value: "both",
                                default: true,
                            },
                            {
                                label: "This device is the source (upload only)",
                                value: "push",
                            },
                            {
                                label: "The cloud is the source (download only)",
                                value: "pull",
                            },
                            {
                                label: "Do not sync automatically (manual sync via buttons below only)",
                                value: "manual",
                            }
                        ]}
                        isSelected={v => v === syncDirection}
                        serialize={v => String(v)}
                        select={v => {
                            setCloudSyncDirection(v);
                            setSyncDirection(v);
                        }}
                        closeOnSelect={true}
                    />
                </div>

                <Grid columns={2} gap="1em" className={Margins.top20}>
                    <ButtonWithIcon
                        variant="positive"
                        disabled={!sectionEnabled}
                        onClick={() => putCloudSettings(true)}
                        Icon={CloudUploadIcon}
                    >
                        Upload Settings
                    </ButtonWithIcon>
                    <Tooltip text="This will replace your current settings with the ones saved in the cloud. Be careful!">
                        {({ onMouseLeave, onMouseEnter }) => (
                            <ButtonWithIcon
                                variant="dangerPrimary"
                                onMouseLeave={onMouseLeave}
                                onMouseEnter={onMouseEnter}
                                disabled={!sectionEnabled}
                                onClick={() => getCloudSettings(true, true)}
                                Icon={CloudDownloadIcon}
                            >
                                Download Settings
                            </ButtonWithIcon>
                        )}
                    </Tooltip>
                </Grid>
            </Flex>
        </section>
    );
}

function ResetSection() {
    const { authenticated, settingsSync } = useSettings(["cloud.authenticated", "cloud.settingsSync"]).cloud;

    return (
        <section style={{ background: "rgba(9, 9, 11, 0.85)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "16px" }}>
            <SectionHeading text="Reset Cloud Data" />

            <Grid columns={2} gap="1em">
                <ButtonWithIcon
                    variant="dangerPrimary"
                    disabled={!authenticated || !settingsSync}
                    onClick={() => deleteCloudSettings()}
                    Icon={DeleteIcon}
                >
                    Delete Settings from Cloud
                </ButtonWithIcon>
                <ButtonWithIcon
                    variant="dangerPrimary"
                    disabled={!authenticated}
                    onClick={() => openModal(props => (
                        <ConfirmModal
                            {...props}
                            title="Are you sure?"
                            subtitle="Once your data is erased, we cannot recover it. There's no going back!"
                            onConfirm={eraseAllCloudData}
                            confirmText="Erase it!"
                            cancelText="Nevermind"
                        />
                    ))}
                    Icon={DeleteIcon}
                >
                    Delete your Cloud Account
                </ButtonWithIcon>
            </Grid>
        </section>
    );
}

function CloudTab() {
    return (
        <div style={{ position: "relative", minHeight: "100%", padding: "20px", borderRadius: "16px", overflow: "hidden" }}>
            <img
                src={CLOUD_BG_GIF}
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
                    <Flex flexDirection="column" gap="1em">
                        <CloudBannerCard />
                        <CloudSetupSection />
                        <Divider style={{ borderColor: "rgba(255,255,255,0.1)" }} />
                        <SettingsSyncSection />
                        <Divider style={{ borderColor: "rgba(255,255,255,0.1)" }} />
                        <ResetSection />
                    </Flex>
                </SettingsTab>
            </div>
        </div>
    );
}

export default wrapTab(CloudTab, "Cloud");