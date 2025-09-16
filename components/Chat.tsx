
import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';
import { getChatResponseStream } from '../services/geminiService';
import Button from './common/Button';

const Chat: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'model', text: 'Hello! I am your AI Financial Assistant. How can I help you manage your finances today?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = async (messageToSend?: string) => {
        const currentMessage = messageToSend || input;
        if (currentMessage.trim() === '' || isLoading) return;

        const newUserMessage: ChatMessage = { role: 'user', text: currentMessage };
        
        const updatedMessages = [...messages, newUserMessage];
        setMessages(updatedMessages);
        setInput('');
        setIsLoading(true);

        const history = messages.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.text }],
        }));
        
        const chatHistoryWithSystemInstruction = [
            { role: 'system', parts: [{ text: 'You are a friendly and professional financial assistant.' }] },
            ...history
        ];

        try {
            const stream = await getChatResponseStream(chatHistoryWithSystemInstruction, currentMessage);
            let text = '';
            setMessages(prev => [...prev, { role: 'model', text: '' }]);

            for await (const chunk of stream) {
                text += chunk.text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1].text = text;
                    return newMessages;
                });
            }
        } catch (error) {
            setMessages(prev => [...prev, { role: 'model', text: 'Sorry, I encountered an error. Please try again.' }]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const suggestedPrompts = [
        "Explain diversification in simple terms",
        "What are the benefits of a Roth IRA?",
        "Give me tips for saving money on groceries",
    ];

    return (
        <div className="flex flex-col h-full max-h-[calc(100vh-4rem)]">
            <header className="mb-4">
                <h2 className="text-3xl font-bold text-base-content">AI Financial Assistant</h2>
                <p className="text-base-content mt-1">Ask me anything about finance, markets, or your goals.</p>
            </header>

            <div className="flex-1 bg-white rounded-2xl shadow-md overflow-hidden flex flex-col">
                <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-lg p-3 rounded-2xl ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-neutral text-base-content'}`}>
                                <p className="text-sm" dangerouslySetInnerHTML={{__html: msg.text.replace(/\n/g, '<br />')}}/>
                            </div>
                        </div>
                    ))}
                    
                    {messages.length === 1 && (
                        <div className="p-4 bg-neutral rounded-lg">
                            <h4 className="font-semibold text-sm mb-2 text-base-content">Not sure where to start? Try these:</h4>
                            <div className="flex flex-col items-start gap-2">
                                {suggestedPrompts.map(prompt => (
                                    <button key={prompt} onClick={() => handleSend(prompt)} className="text-sm text-accent hover:underline text-left">
                                        {prompt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {isLoading && messages[messages.length-1]?.role === 'user' && (
                         <div className="flex justify-start">
                            <div className="max-w-lg p-3 rounded-2xl bg-neutral text-base-content">
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-75"></div>
                                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-150"></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <div className="p-4 bg-gray-50 border-t">
                    <div className="flex items-center gap-4">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Type your message..."
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary bg-white text-base-content placeholder-gray-500"
                            disabled={isLoading}
                        />
                        <Button onClick={() => handleSend()} isLoading={isLoading}>Send</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Chat;
