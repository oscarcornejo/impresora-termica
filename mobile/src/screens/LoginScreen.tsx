import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { Notice } from '../ui/Notice';
import { colors, radius, space, text } from '../ui/theme';

interface LoginScreenProps {
  onSignIn: (email: string, password: string) => Promise<string | null>;
}

/** Entrada con la cuenta del negocio. La sesión queda guardada en el teléfono. */
export function LoginScreen({ onSignIn }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  async function submit() {
    if (!email.trim() || !password) {
      setError('Escribe el correo y la contraseña de la cuenta del negocio.');
      return;
    }
    setIsSending(true);
    setError(await onSignIn(email, password));
    setIsSending(false);
  }

  return (
    <SafeAreaView style={styles.page}>
      <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.center} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text accessibilityRole="header" style={styles.title}>Impresora térmica</Text>
            <Text style={styles.hint}>Entra con la cuenta del negocio. Queda guardada en este teléfono.</Text>
            <Field
              label="Correo"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="username"
              autoComplete="email"
              returnKeyType="next"
            />
            <Field
              label="Contraseña"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="password"
              autoComplete="current-password"
              returnKeyType="go"
              onSubmitEditing={submit}
            />
            {error && <Notice>{error}</Notice>}
            <Button label={isSending ? 'Entrando…' : 'Entrar'} variant="primary" onPress={submit} isBusy={isSending} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

interface MessageScreenProps {
  title: string;
  message: string;
  action?: { label: string; onPress: () => void };
}

/** Pantalla de estado (cargando, sin acceso, falta configuración). */
export function MessageScreen({ title, message, action }: MessageScreenProps) {
  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.center}>
        <View style={styles.card} accessibilityLiveRegion="polite">
          <Text accessibilityRole="header" style={styles.title}>{title}</Text>
          <Text style={styles.body}>{message}</Text>
          {action && <Button label={action.label} onPress={action.onPress} />}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  center: { flexGrow: 1, justifyContent: 'center', padding: space(4) },
  card: { backgroundColor: colors.surface, borderRadius: radius.l, padding: space(6), gap: space(4) },
  title: { fontSize: 26, fontWeight: '700', color: colors.ink },
  hint: { fontSize: text.meta, color: colors.inkSoft, lineHeight: 20 },
  body: { fontSize: text.body, color: colors.ink, lineHeight: 22 },
});
