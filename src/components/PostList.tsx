import React from 'react';
import { View, Text, Button, FlatList, StyleSheet } from 'react-native';

type Post = {
  id?: number | string;
  topicId?: string;
  category?: string;
  content?: string;
  author?: string;
  createdAt?: number;
};

export function PostList({ data, onView }: { data: Post[]; onView?: (post: Post) => Promise<any> | void }) {
  return (
    <FlatList
      data={data}
      keyExtractor={(i) => String(i.id ?? i.topicId ?? Math.random())}
      renderItem={({ item }) => (
        <View style={styles.item}>
          <Text style={styles.title}>{item.category ?? 'Post'}</Text>
          <Text style={styles.content}>{item.content}</Text>
          <View style={styles.row}>
            <Text style={styles.meta}>{item.author ?? 'unknown'}</Text>
            <Button title="View (count as ad)" onPress={() => onView && onView(item)} />
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  item: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontWeight: '700', marginBottom: 6 },
  content: { marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  meta: { color: '#666', fontSize: 12 },
});

export default PostList;
