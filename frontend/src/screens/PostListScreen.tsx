import React, { useEffect, useState } from 'react';
import { View, Text, Image, FlatList, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { fetchPosts } from '../services/postService';
import { Post } from '../types/types';
'../services/postService';
const PostListScreen = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const data = await fetchPosts();
        setPosts(data);
      } catch (error: any) {
        Alert.alert('Erro', error.message || 'Não foi possível carregar os posts.');
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, []);

  const renderPost = ({ item }: { item: Post }) => (
    <View style={styles.post}>
      <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
      <Text style={styles.niche}>Nicho: {item.niche.join(', ')}</Text>
      <Text style={styles.views}>Visualizações: {item.views}</Text>
      <Text style={styles.likes}>Curtidas: {item.likes}</Text>
    </View>
  );

  if (loading) {
    return <ActivityIndicator size="large" color="#004AAD" style={styles.loading} />;
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      renderItem={renderPost}
      contentContainerStyle={styles.list}
    />
  );
};

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
  },
  post: {
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  thumbnail: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  niche: {
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  views: {
    fontSize: 12,
    marginBottom: 4,
  },
  likes: {
    fontSize: 12,
    marginBottom: 4,
  },
});

export default PostListScreen;
