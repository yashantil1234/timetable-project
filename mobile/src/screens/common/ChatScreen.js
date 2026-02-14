import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator
} from 'react-native';
import apiService from '../../services/api';

const ChatScreen = () => {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollViewRef = useRef();

    useEffect(() => {
        loadChatHistory();
    }, []);

    const loadChatHistory = async () => {
        try {
            const response = await apiService.getChatHistory();
            if (response && response.history) {
                setMessages(response.history);
            }
        } catch (error) {
            console.error('Error loading chat history:', error);
        }
    };

    const sendMessage = async () => {
        if (!inputText.trim()) return;

        const userMessage = {
            type: 'user',
            message: inputText.trim(),
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsLoading(true);

        try {
            const response = await apiService.sendChatMessage(userMessage.message);

            if (response && response.response) {
                const botMessage = {
                    type: 'bot',
                    message: response.response,
                    timestamp: new Date().toISOString()
                };
                setMessages(prev => [...prev, botMessage]);
            }
        } catch (error) {
            const errorMessage = {
                type: 'bot',
                message: `Error: ${error.message || 'Failed to send message'}`,
                timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={100}
        >
            <ScrollView
                ref={scrollViewRef}
                style={styles.messagesContainer}
                onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
                {messages.length === 0 && (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>👋 Hi! I'm your AI Assistant</Text>
                        <Text style={styles.emptySubtext}>Ask me about your timetable, rooms, or announcements</Text>
                    </View>
                )}

                {messages.map((msg, index) => (
                    <View
                        key={index}
                        style={[
                            styles.messageBubble,
                            msg.type === 'user' ? styles.userBubble : styles.botBubble
                        ]}
                    >
                        <Text style={[
                            styles.messageText,
                            msg.type === 'user' ? styles.userText : styles.botText
                        ]}>
                            {msg.message}
                        </Text>
                    </View>
                ))}

                {isLoading && (
                    <View style={styles.loadingBubble}>
                        <ActivityIndicator size="small" color="#3498db" />
                        <Text style={styles.loadingText}>Thinking...</Text>
                    </View>
                )}
            </ScrollView>

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder="Type your message..."
                    multiline
                    maxLength={500}
                    onSubmitEditing={sendMessage}
                />
                <TouchableOpacity
                    style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                    onPress={sendMessage}
                    disabled={!inputText.trim() || isLoading}
                >
                    <Text style={styles.sendButtonText}>Send</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    messagesContainer: {
        flex: 1,
        padding: 16,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 100,
    },
    emptyText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#7f8c8d',
        textAlign: 'center',
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 16,
        marginBottom: 12,
    },
    userBubble: {
        alignSelf: 'flex-end',
        backgroundColor: '#3498db',
    },
    botBubble: {
        alignSelf: 'flex-start',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
    },
    userText: {
        color: '#fff',
    },
    botText: {
        color: '#2c3e50',
    },
    loadingBubble: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    loadingText: {
        marginLeft: 8,
        color: '#7f8c8d',
        fontStyle: 'italic',
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    input: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 8,
        maxHeight: 100,
        fontSize: 15,
    },
    sendButton: {
        backgroundColor: '#3498db',
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 10,
        justifyContent: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: '#95a5a6',
    },
    sendButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 15,
    },
});

export default ChatScreen;
