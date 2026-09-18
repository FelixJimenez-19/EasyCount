import { CountService } from "@/src/services/count-service";
import { EvidenceService, type Evidence } from "@/src/services/evidence-service";
import { NotificationService } from "@/src/services/notification-service";
import { openSystemSettings, type PermissionState } from "@/src/services/permissions";
import { BlurView } from "expo-blur";
import { Bell, Camera, Images, Save, X } from "lucide-react-native";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Image, Keyboard, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import DenomRow from "./denomrow";
import { Denomination, TransactionBreakdown } from "./types/models";
import { fmt } from "./utilities/utilities";
import Button from "./components/buttons";
import { useToast } from "./components/toast";

interface HomeProps {
    denominaciones: Denomination[];
    cantidades: Record<number, number>;
    setCantidades: Dispatch<SetStateAction<Record<number, number>>>;
    grandTotal: number;
}

type PromptMode = "ask" | "denied" | "blocked" | null;

export default function Home({ denominaciones, cantidades, setCantidades, grandTotal }: HomeProps) {
    const { show } = useToast();
    const [observacion, setObservacion] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [notifPrompt, setNotifPrompt] = useState<PromptMode>(null);
    const [cameraPrompt, setCameraPrompt] = useState<PromptMode>(null);
    const [cameraUnavailable, setCameraUnavailable] = useState(false);
    const [evidence, setEvidence] = useState<Evidence | null>(null);
    const [saved, setSaved] = useState(false);
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    useEffect(() => {
        const showEvt = Platform.OS === "android" ? "keyboardDidShow" : "keyboardWillShow";
        const hideEvt = Platform.OS === "android" ? "keyboardDidHide" : "keyboardWillHide";
        const showSub = Keyboard.addListener(showEvt, (e) => setKeyboardHeight(e.endCoordinates.height));
        const hideSub = Keyboard.addListener(hideEvt, () => setKeyboardHeight(0));
        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    const bills = denominaciones.filter((d) => d.type === "Billete" && d.active);
    const coins = denominaciones.filter((d) => d.type === "Moneda" && d.active);

    // Lógica controlada para botones + y - (onUpdate)
    const handleUpdateCantidad = (id: number, valor: number) => {
        setCantidades((prev) => {
            const actual = prev[id] || 0;
            const nueva = actual + valor;
            return { ...prev, [id]: nueva < 0 ? 0 : nueva }; // Evitamos negativos
        });
    };

    // Lógica para el input de texto directo (onDirect)
    const handleInputChange = (id: number, texto: string) => {
        const numeroLimpio = texto.replace(/[^0-9]/g, "");
        const valorNumerico = numeroLimpio === "" ? 0 : parseInt(numeroLimpio, 10);
        setCantidades((prev) => ({ ...prev, [id]: valorNumerico }));
    };

    const calcularSubtotal = (id: number, valor: number) => (cantidades[id] || 0) * valor;

    // ---------------------------------------------------------------
    // Notificaciones: solicitud en el momento de uso (al guardar),
    // precedida de una explicación. Estados según la guía:
    // - concedido: se usa con normalidad (aviso tras sincronizar).
    // - restringido/no disponible: se oculta el flujo, sin error técnico.
    // - denegado: explicar motivo + botón "Volver a solicitar".
    // - denegación permanente: explicar + enlace a Ajustes del sistema.
    // ---------------------------------------------------------------
    const openSaveModal = async () => {
        let state: PermissionState = "granted";
        try {
            state = await NotificationService.getPermissionState();
        } catch {
            // Capacidad no disponible: se oculta el flujo de avisos.
        }
        if (state === "undetermined") {
            setNotifPrompt("ask");
            return;
        }
        if (state === "denied") {
            setNotifPrompt("denied");
            return;
        }
        if (state === "denied_permanently") {
            setNotifPrompt("blocked");
            return;
        }
        setShowModal(true);
    };

    const requestNotifications = async () => {
        let result: PermissionState = "denied";
        try {
            result = await NotificationService.requestPermission();
        } catch {
            // Capacidad no disponible: se continúa sin avisos.
            result = "denied_permanently";
        }
        if (result === "granted") {
            setNotifPrompt(null);
            show("Avisos activados", "Te avisaremos cuando tus cierres se sincronicen con el servidor.", { variant: "success" });
            setShowModal(true);
            return;
        }
        // El diálogo del sistema ya respondió: si fue denegado, se explica
        // el motivo y se ofrece volver a solicitar (o Ajustes si es permanente).
        setNotifPrompt(result === "denied_permanently" ? "blocked" : "denied");
    };

    const skipNotifications = () => {
        setNotifPrompt(null);
        setShowModal(true);
    };

    const openNotifSettings = () => {
        void openSystemSettings();
    };

    // ---------------------------------------------------------------
    // Cámara: foto de respaldo del cierre. Mismos cuatro estados;
    // ante restricción/disponibilidad la funcionalidad se oculta.
    // ---------------------------------------------------------------
    const pickFromGallery = async () => {
        setCameraPrompt(null);
        // El selector de fotos del sistema gestiona él mismo el acceso la
        // primera vez (Android 13+ / iOS 14+): no hay permiso que solicitar.
        const photo = await EvidenceService.pickPhoto();
        if (photo) setEvidence(photo);
    };

    const tryCapture = async () => {
        try {
            const photo = await EvidenceService.capturePhoto();
            if (photo) setEvidence(photo);
        } catch {
            // Restringido / no disponible (sin cámara o app de cámara):
            // se oculta la funcionalidad y se mantiene la galería.
            setCameraUnavailable(true);
            show("Cámara no disponible", "Puedes adjuntar una foto desde la galería.", { variant: "info" });
        }
    };

    const attachEvidence = async () => {
        if (cameraUnavailable) {
            await pickFromGallery();
            return;
        }
        let state: PermissionState;
        try {
            state = await EvidenceService.getCameraState();
        } catch {
            setCameraUnavailable(true);
            return;
        }
        if (state === "granted") {
            await tryCapture();
            return;
        }
        if (state === "undetermined") {
            setCameraPrompt("ask");
            return;
        }
        if (state === "denied_permanently") {
            setCameraPrompt("blocked");
            return;
        }
        setCameraPrompt("denied");
    };

    const useCamera = async () => {
        let result: PermissionState;
        try {
            result = await EvidenceService.requestCamera();
        } catch {
            result = "denied_permanently";
        }
        if (result === "granted") {
            setCameraPrompt(null);
            await tryCapture();
            return;
        }
        setCameraPrompt(result === "denied_permanently" ? "blocked" : "denied");
    };

    // Acción de persistencia definitiva hacia el Backend local
    const handleGuardarCierre = async () => {
        if (grandTotal === 0) {
            show("Conteo vacío", "No puedes guardar un conteo con saldo de $0.00", { variant: "error" });
            return;
        }

        // Filtramos solo las monedas que el usuario efectivamente contó
        const desglosesAInsertar: TransactionBreakdown[] = denominaciones
            .filter((d) => d.active && (cantidades[d.id_denomination] || 0) > 0)
            .map((d) => ({
                id_denomination: d.id_denomination,
                value: d.value,
                label: d.label,
                quantity: cantidades[d.id_denomination],
                subtotal: calcularSubtotal(d.id_denomination, d.value),
            }));

        const exito = await CountService.saveTransaction(grandTotal, observacion || "Sin observación", desglosesAInsertar, evidence);

        setShowModal(false);

        if (exito) {
            setObservacion("");
            setEvidence(null);
            setCantidades((prev) => Object.fromEntries(Object.keys(prev).map((key) => [Number(key), 0])));
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        } else {
            show("Error", "Hubo un problema al intentar escribir en el almacenamiento del dispositivo.", { variant: "error" });
        }
    };

    return (
        <View className="flex h-full  flex-col  ">
            {/* Scrollable list */}
            <ScrollView className="flex-1 mx-4 pt-4 " showsVerticalScrollIndicator={false}>
                {bills.length > 0 && (
                    <View>
                        <Text className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3 px-1">Billetes</Text>
                        <View className="space-y-2 gap-2 ">
                            {bills.map((d) => (
                                <DenomRow
                                    key={d.id_denomination}
                                    denomination={d}
                                    qty={cantidades[d.id_denomination] ?? 0}
                                    onUpdate={handleUpdateCantidad}
                                    onDirect={handleInputChange}
                                />
                            ))}
                        </View>
                    </View>
                )}
                {coins.length > 0 && (
                    <View className="">
                        <Text className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3 px-1">Monedas</Text>
                        <View className="space-y-2 gap-2">
                            {coins.map((d) => (
                                <DenomRow
                                    key={d.id_denomination}
                                    denomination={d}
                                    qty={cantidades[d.id_denomination] ?? 0}
                                    onUpdate={handleUpdateCantidad}
                                    onDirect={handleInputChange}
                                />
                            ))}
                        </View>
                    </View>
                )}
                <View className="h-2" />
            </ScrollView>

            {/* Sticky footer */}
            <View className="px-4 pb-4 pt-3 border-t border-border ">
                {saved && (
                    <View className="mb-3 px-4 py-2.5 rounded-2xl bg-primary/10 border border-primary/20 flex items-center gap-2">
                        <View className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <Text className="text-primary text-sm font-medium">Conteo guardado correctamente</Text>
                    </View>
                )}
                <View className="flex flex-row items-baseline justify-between mb-3 px-1 ">
                    <Text className="text-sm text-muted-foreground font-medium">Total</Text>
                    <Text className="text-3xl font-bold text-primary font-mono">${fmt(grandTotal)}</Text>
                </View>

                <Button label="Guardar Conteo" icon={Save} size="xl" onPress={openSaveModal} />
            </View>

            {/* Explicación previa + solicitud de permiso de notificaciones */}
            <Modal visible={notifPrompt !== null} transparent animationType="fade" onRequestClose={() => setNotifPrompt(null)}>
                <View className="flex-1 items-center justify-center bg-black/60 px-6">
                    <View className="w-full bg-card rounded-3xl p-6 border border-border shadow-lg shadow-black/40">
                        <View className="w-12 h-12 rounded-2xl bg-primary/15 items-center justify-center mb-4">
                            <Bell size={22} color="#4ade80" />
                        </View>
                        <Text className="text-base font-semibold text-foreground">Avisos de sincronización</Text>
                        <Text className="text-sm text-muted-foreground mt-2 leading-relaxed">
                            {notifPrompt === "blocked"
                                ? "Las notificaciones están desactivadas de forma permanente en los Ajustes del sistema. Ábrelos para activarlas, o continúa sin avisos: el estado de sincronización siempre estará disponible en Reportes."
                                : notifPrompt === "denied"
                                  ? "Los avisos están desactivados. Sin ellos no recibirás confirmación cuando tus cierres se sincronicen con el servidor, aunque podrás ver el estado en Reportes."
                                  : "EasyCount guarda tus cierres incluso sin conexión. Activa las notificaciones para avisarte cuando tus cierres se sincronicen con el servidor."}
                        </Text>
                        <View className="flex flex-col gap-2 mt-5">
                            {notifPrompt === "ask" && (
                                <>
                                    <Button label="Activar avisos" variant="primary" icon={Bell} onPress={requestNotifications} />
                                    <Button label="Ahora no" variant="outline" onPress={skipNotifications} />
                                </>
                            )}
                            {notifPrompt === "denied" && (
                                <>
                                    <Button label="Volver a solicitar" variant="primary" icon={Bell} onPress={requestNotifications} />
                                    <Button label="Continuar sin avisos" variant="outline" onPress={skipNotifications} />
                                </>
                            )}
                            {notifPrompt === "blocked" && (
                                <>
                                    <Button label="Abrir ajustes del sistema" variant="primary" onPress={openNotifSettings} />
                                    <Button label="Continuar sin avisos" variant="outline" onPress={skipNotifications} />
                                </>
                            )}
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Explicación previa + solicitud de permiso de cámara */}
            <Modal visible={cameraPrompt !== null} transparent animationType="fade" onRequestClose={() => setCameraPrompt(null)}>
                <View className="flex-1 items-center justify-center bg-black/60 px-6">
                    <View className="w-full bg-card rounded-3xl p-6 border border-border shadow-lg shadow-black/40">
                        <View className="w-12 h-12 rounded-2xl bg-primary/15 items-center justify-center mb-4">
                            <Camera size={22} color="#4ade80" />
                        </View>
                        <Text className="text-base font-semibold text-foreground">Foto de respaldo</Text>
                        <Text className="text-sm text-muted-foreground mt-2 leading-relaxed">
                            {cameraPrompt === "blocked"
                                ? "El acceso a la cámara está desactivado de forma permanente en los Ajustes del sistema. Ábrelos para activarlo, o elige una foto de la galería."
                                : cameraPrompt === "denied"
                                  ? "El acceso a la cámara fue denegado. Sin él no puedes tomar una foto de respaldo de tu cierre; puedes volver a solicitarlo o elegir una foto de la galería. Si vuelves a denegar, el sistema no te preguntará más y deberás activarlo desde los Ajustes."
                                  : "Para adjuntar una foto de respaldo (recibo o arqueo) a tu cierre, EasyCount necesita acceso a tu cámara. La foto se guarda junto con tu conteo y se envía al servidor cuando haya conexión."}
                        </Text>
                        <View className="flex flex-col gap-2 mt-5">
                            {cameraPrompt === "ask" && <Button label="Usar cámara" variant="primary" icon={Camera} onPress={useCamera} />}
                            {cameraPrompt === "denied" && <Button label="Volver a solicitar" variant="primary" icon={Camera} onPress={useCamera} />}
                            {cameraPrompt === "blocked" && (
                                <Button label="Abrir ajustes del sistema" variant="primary" onPress={() => void openSystemSettings()} />
                            )}
                            <Button label="Elegir de la galería" variant="outline" icon={Images} onPress={pickFromGallery} />
                            <Button label="Cancelar" variant="outline" onPress={() => setCameraPrompt(null)} />
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Modal de confirmación del cierre */}
            <Modal visible={showModal} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setShowModal(false)}>
                <TouchableOpacity className="flex-1 bg-black/60 backdrop-blur-sm" activeOpacity={1} onPress={() => setShowModal(false)}>
                    <BlurView intensity={40} tint="dark" experimentalBlurMethod="dimezisBlurView" style={StyleSheet.absoluteFill} />
                    <View className="flex-1 justify-end" style={{ paddingBottom: keyboardHeight }}>
                        <TouchableOpacity
                            className="w-full bg-card rounded-t-3xl p-6 pb-8 shadow-2xl"
                            activeOpacity={1}
                            onPress={(e) => e.stopPropagation()}
                        >
                            <View className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />
                            <Text className="text-lg font-semibold text-foreground mb-1">Guardar Conteo</Text>
                            <Text className="text-sm text-muted-foreground mb-4">
                                Total: <Text className="text-primary font-semibold">${fmt(grandTotal)}</Text>
                            </Text>
                            <Text className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Observación opcional</Text>
                            <TextInput
                                value={observacion}
                                onChange={(e) => setObservacion(e.nativeEvent.text)}
                                multiline
                                placeholder="Ej: Cierre de caja matutino..."
                                numberOfLines={3}
                                className="w-full bg-secondary rounded-2xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none focus:ring-2 focus:ring-primary/40 border border-border"
                            />

                            <View className="pt-4">
                                <Text className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                                    Respaldo fotográfico (opcional)
                                </Text>
                                {evidence ? (
                                    <View className="flex-row items-center gap-3 bg-secondary rounded-2xl p-3 border border-border">
                                        <Image source={{ uri: evidence.uri }} className="w-14 h-14 rounded-xl bg-background" />
                                        <View className="flex-1">
                                            <Text className="text-sm text-foreground font-medium">Foto adjuntada</Text>
                                            <Text className="text-xs text-muted-foreground">Se guardará y sincronizará con tu cierre</Text>
                                        </View>
                                        <Pressable
                                            onPress={() => setEvidence(null)}
                                            className="w-8 h-8 items-center justify-center bg-background rounded-full active:opacity-70"
                                        >
                                            <X size={14} color="#94a3b8" />
                                        </Pressable>
                                    </View>
                                ) : (
                                    <View className="flex-row gap-2">
                                        {!cameraUnavailable && (
                                            <Button label="Tomar foto" variant="outline" icon={Camera} className="flex-1" onPress={attachEvidence} />
                                        )}
                                        <Button label="Galería" variant="outline" icon={Images} className="flex-1" onPress={pickFromGallery} />
                                    </View>
                                )}
                            </View>

                            <View className="flex flex-row  gap-3 mt-5">
                                <Button label="Cancelar" variant="outline" onPress={() => setShowModal(false)} />
                                <Button label="Confirmar" variant="primary" icon={Save} className=" grow-2" onPress={handleGuardarCierre} />
                            </View>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}
