import { StyleSheet, Platform, } from 'react-native';
import { useTheme } from '@react-navigation/native';

const Styles = () => {
  const { colors } = useTheme();

  return StyleSheet.create({
    keyboardContainer: { flex: 1 },
    container: { flex: 1, backgroundColor: colors.background },
    contactsList: { padding: 20, alignItems: 'center' },
    contactItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 15,
      borderBottomWidth: 1,
      borderColor: colors.border,
      width: '100%',
    },
    contactImage: { width: 40, height: 40, borderRadius: 20 },
    contactName: { marginLeft: 10, fontSize: 18, color: colors.text },
    chatHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 15,
      backgroundColor: colors.card,
    },
    chatHeaderTitle: {
      color: colors.primary,
      fontSize: 18,
      fontWeight: 'bold',
      flex: 1,
      textAlign: 'center',
    },
    headerIcons: { flexDirection: 'row', alignItems: 'center', marginLeft: 20 },
    rightIcons: { flexDirection: 'row', alignItems: 'center', marginLeft: 20 },
    iconButton: { marginHorizontal: 10 },
    messagesList: { padding: 10 },
    messageContainer: {
      marginVertical: 5,
      padding: 10,
      borderRadius: 10,
      maxWidth: '80%',
    },
    myMessage: { backgroundColor: colors.primary, alignSelf: 'flex-end' },
    otherMessage: { backgroundColor: colors.card, alignSelf: 'flex-start' },
    messageText: { fontSize: 16, color: colors.text },
    messageTime: { fontSize: 12, color: colors.border, marginTop: 5, textAlign: 'right' },
    input: {
      flex: 1,
      backgroundColor: colors.background,
      borderRadius: 20,
      paddingHorizontal: 15,
      paddingVertical: 8,
      marginHorizontal: 10,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.text,
    },bottomBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary,
      padding: 10,
      height: 60, // ou outro valor fixo
    },
    
    
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      width: '80%',
      backgroundColor: colors.card,
      borderRadius: 10,
      padding: 20,
      maxHeight: '80%',
    },
    modalContent: { alignItems: 'center' },
    modalImage: { width: 100, height: 100, borderRadius: 50, marginBottom: 10 },
    modalName: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, color: colors.text },
    modalBio: { fontSize: 16, textAlign: 'center', marginBottom: 20, color: colors.text },
    closeButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 5,
    },
    closeButtonText: { color: colors.text, fontSize: 16 },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 20,
    },
    loadingText: { marginTop: 10, fontSize: 26, color: colors.primary },
    chatHeaderImage: { width: 40, height: 40, borderRadius: 20, marginHorizontal: 10 },
    audioPlayerButton: { padding: 8 },audioPlayerContainer: {
      padding: 10,
      backgroundColor: '#f0f0f0',
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
    },
    waveformContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      paddingVertical: 5,
    },
  });
};

export default Styles;

