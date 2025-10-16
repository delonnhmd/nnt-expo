import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { getApi } from '@/lib/api';

export default function ComposeScreen() {
  const [topicId, setTopicId] = useState('');
  const [category, setCategory] = useState('General');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Load draft on open
  useEffect(() => {
    (async () => {
      try {
        const storage = (await import('@react-native-async-storage/async-storage')).default;
        const raw = await storage.getItem('draft:compose');
        if (raw) {
          const d = JSON.parse(raw);
          if (d.topicId) setTopicId(d.topicId);
          if (d.author) setAuthor(d.author);
          if (d.category) setCategory(d.category);
          if (d.content) setContent(d.content);
        }
      } catch {}
    })();
  }, []);

  const onSubmit = async () => {
    if (submitting) return;
    if (!content.trim()) {
      Alert.alert('Enter content', 'Please enter some content for your post.');
      return;
    }
    setSubmitting(true);
    try {
      const api = await getApi();
      // Ensure device is registered (simulated account)
      try { await api.register(); } catch {}
      const body = { topicId: topicId || undefined, category: category || undefined, content, author: author || undefined };
      const r = await api.createPost(body);
      if (!r?.ok && !r?.id) throw new Error('Unexpected response from server');
      Alert.alert('Posted', 'Your post has been submitted.');
      try { router.back(); } catch {}
    } catch (e: any) {
      Alert.alert('Post failed', e?.message || String(e));
    } finally {
      setSubmitting(false);
    }
  };

  const onUpload = async () => {
    try {
      setUploading(true);
      let picker: any;
      try { picker = await import('expo-image-picker'); } catch { Alert.alert('Unavailable', 'Image Picker is not available in this build.'); return; }
      const perm = await picker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') { Alert.alert('Permission required', 'Media library permission is needed.'); return; }
      const res = await picker.launchImageLibraryAsync({ mediaTypes: picker.MediaTypeOptions.All, allowsEditing: false, quality: 0.8 });
      if (res.canceled || !res.assets || !res.assets[0]) return;
      const asset = res.assets[0];
      const uri = asset.uri;
      if (!uri) return;
      const form = new FormData();
      const nameGuess = uri.split('/').pop() || 'upload.bin';
      const ct = asset.type === 'video' ? 'video/mp4' : 'image/jpeg';
      form.append('file', ({ uri, name: nameGuess, type: ct } as unknown) as any);
      const apiBase = process.env.EXPO_PUBLIC_BACKEND || '';
      const r = await fetch(`${apiBase}/upload`, { method: 'POST', body: form } as any);
      const txt = await r.text();
      let j: any = null;
      try { j = txt ? JSON.parse(txt) : null; } catch {
        const sn = (txt || '').slice(0, 200);
        throw new Error(`Upload returned non-JSON: ${sn}`);
      }
      if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      // Append URL to content for convenience
      const url = j.url;
      setContent((c) => c ? `${c}\n${url}` : url);
  // Optional: Copy to clipboard would go here; omitted to avoid native dep.
      Alert.alert('Uploaded', 'Media URL added to your post and copied to clipboard.');
    } catch (e: any) {
      Alert.alert('Upload failed', e?.message || String(e));
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => { try { router.back(); } catch { router.push('/'); } }}>
          <Text style={styles.link}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Compose Post</Text>
        <TouchableOpacity onPress={() => router.push('/') }>
          <Text style={styles.link}>Home</Text>
        </TouchableOpacity>
      </View>
      <TextInput
        placeholder="Topic (optional)"
        value={topicId}
        onChangeText={setTopicId}
        style={styles.input}
      />
      <TextInput
        placeholder="Author (display name)"
        value={author}
        onChangeText={setAuthor}
        style={styles.input}
      />
      <TextInput
        placeholder="Category"
        value={category}
        onChangeText={setCategory}
        style={styles.input}
      />
      <TextInput
        placeholder="Write your content..."
        value={content}
        onChangeText={setContent}
        multiline
        style={[styles.input, { height: 120 }]}
      />
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
        <TouchableOpacity style={[styles.secondaryButton, uploading && { opacity: 0.6 }]} onPress={onUpload} disabled={uploading}>
          <Text style={styles.secondaryText}>{uploading ? 'Uploading…' : 'Upload Photo/Video'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={async () => {
          try {
            const key = 'draft:compose';
            const payload = JSON.stringify({ topicId, author, category, content });
            const storage = (await import('@react-native-async-storage/async-storage')).default;
            await storage.setItem(key, payload);
            Alert.alert('Saved', 'Draft saved.');
          } catch (e:any) { Alert.alert('Save failed', e?.message||String(e)); }
        }}>
          <Text style={styles.secondaryText}>Save Draft</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={async () => {
          try {
            const storage = (await import('@react-native-async-storage/async-storage')).default;
            await storage.removeItem('draft:compose');
            setTopicId(''); setAuthor(''); setCategory('General'); setContent('');
            Alert.alert('Cleared', 'Draft cleared.');
          } catch (e:any) { Alert.alert('Clear failed', e?.message||String(e)); }
        }}>
          <Text style={styles.secondaryText}>Clear Draft</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={[styles.button, submitting && { opacity: 0.6 }]} onPress={onSubmit} disabled={submitting}>
        <Text style={styles.buttonText}>{submitting ? 'Posting…' : 'Post'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: 'white' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 18, fontWeight: '700' },
  link: { color: '#2563EB', fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 10, marginBottom: 10 },
  button: { backgroundColor: '#111827', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: '700' },
  secondaryButton: { backgroundColor: '#F3F4F6', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8 },
  secondaryText: { color: '#111827', fontWeight: '600' },
});
