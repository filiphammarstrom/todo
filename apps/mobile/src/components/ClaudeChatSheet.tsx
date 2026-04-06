import { useState, useRef } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { useSupabase } from '../context/SupabaseContext'
import { useAuthStore, useTaskMutations, useProjects } from '@todo/store'

interface ParsedTask {
  title: string
  dueDate?: string
  priority?: 1 | 2 | 3 | 4
  projectName?: string
  notes?: string
  subtasks?: string[]
}

interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
  tasks?: ParsedTask[]
}

const PRIORITY_COLORS: Record<number, string> = {
  1: '#FF3B30',
  2: '#FF9500',
  3: '#007AFF',
  4: '#8E8E93',
}

export default function ClaudeChatSheet() {
  const supabase = useSupabase()
  const user = useAuthStore((s) => s.user)
  const { create } = useTaskMutations(supabase)
  const { data: projects = [] } = useProjects(supabase, user?.id ?? '')

  const [visible, setVisible] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<ScrollView>(null)

  async function sendMessage() {
    if (!input.trim() || loading || !user) return

    const userMsg = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', text: userMsg }])
    setLoading(true)

    try {
      const { data, error } = await supabase.functions.invoke('claude-task', {
        body: { text: userMsg, userId: user.id },
      })

      if (error) throw error

      const parsed: ParsedTask[] = Array.isArray(data.tasks) ? data.tasks : [data.task].filter(Boolean)

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: data.message ?? `Hittade ${parsed.length} uppgift(er).`,
          tasks: parsed,
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'Fel: Kunde inte tolka uppgiften. Försök igen.' },
      ])
    } finally {
      setLoading(false)
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)
    }
  }

  async function createParsedTasks(tasks: ParsedTask[]) {
    for (const task of tasks) {
      const project = task.projectName
        ? projects.find((p) => p.name.toLowerCase().includes(task.projectName!.toLowerCase()))
        : undefined

      await create.mutateAsync({
        title: task.title,
        notes: task.notes ?? null,
        due_date: task.dueDate ?? null,
        priority: task.priority ?? 4,
        project_id: project?.id ?? null,
        status: 'open',
        user_id: user!.id,
        created_by: user!.id,
      })
    }
    setMessages((prev) => [
      ...prev,
      { role: 'assistant', text: `${tasks.length} uppgift(er) har lagts till!` },
    ])
  }

  return (
    <>
      <TouchableOpacity style={styles.trigger} onPress={() => setVisible(true)}>
        <Text style={styles.triggerText}>Claude</Text>
      </TouchableOpacity>

      <Modal
        visible={visible}
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Claude AI</Text>
            <TouchableOpacity onPress={() => setVisible(false)}>
              <Text style={styles.closeBtn}>Stäng</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={scrollRef}
            style={styles.messages}
            contentContainerStyle={styles.messagesContent}
          >
            {messages.length === 0 && (
              <View style={styles.welcome}>
                <Text style={styles.welcomeText}>
                  Hej! Beskriv uppgifter med naturligt språk.
                </Text>
                <Text style={styles.exampleText}>
                  Exempel: "Köp mjölk imorgon P2 i projekt Hem"
                </Text>
              </View>
            )}

            {messages.map((msg, i) => (
              <View
                key={i}
                style={[styles.bubble, msg.role === 'user' ? styles.userBubble : styles.assistantBubble]}
              >
                <Text style={[styles.bubbleText, msg.role === 'user' && styles.userBubbleText]}>
                  {msg.text}
                </Text>

                {msg.tasks && msg.tasks.length > 0 && (
                  <View style={styles.taskPreview}>
                    {msg.tasks.map((t, j) => (
                      <View key={j} style={styles.taskChip}>
                        <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLORS[t.priority ?? 4] }]} />
                        <Text style={styles.taskChipText} numberOfLines={1}>{t.title}</Text>
                        {t.dueDate && (
                          <Text style={styles.taskChipDate}>{t.dueDate}</Text>
                        )}
                      </View>
                    ))}
                    <TouchableOpacity
                      style={[styles.createBtn, create.isPending && styles.createBtnDisabled]}
                      onPress={() => createParsedTasks(msg.tasks!)}
                      disabled={create.isPending}
                    >
                      <Text style={styles.createBtnText}>Lägg till alla</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}

            {loading && (
              <View style={[styles.bubble, styles.assistantBubble]}>
                <ActivityIndicator size="small" />
              </View>
            )}
          </ScrollView>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Skriv en uppgift eller fråga Claude..."
              multiline
              editable={!loading}
              returnKeyType="send"
              onSubmitEditing={sendMessage}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
              onPress={sendMessage}
              disabled={!input.trim() || loading}
            >
              <Text style={styles.sendBtnText}>↑</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  trigger: {
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  triggerText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  closeBtn: {
    color: '#007AFF',
    fontSize: 16,
  },
  messages: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 12,
  },
  welcome: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  welcomeText: {
    fontSize: 16,
    color: '#000',
    textAlign: 'center',
  },
  exampleText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  bubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 16,
    gap: 8,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#F2F2F7',
  },
  bubbleText: {
    fontSize: 15,
    color: '#000',
  },
  userBubbleText: {
    color: '#fff',
  },
  taskPreview: {
    gap: 6,
  },
  taskChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    gap: 8,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  taskChipText: {
    flex: 1,
    fontSize: 14,
    color: '#000',
  },
  taskChipDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  createBtn: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  createBtnDisabled: {
    opacity: 0.5,
  },
  createBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    backgroundColor: '#F9F9F9',
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  sendBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
})
