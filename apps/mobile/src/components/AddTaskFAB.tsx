import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { useTaskMutations, useProjects } from '@todo/store'
import { useSupabase } from '../context/SupabaseContext'
import { useAuthStore } from '@todo/store'

interface AddTaskFABProps {
  projectId?: string
}

export default function AddTaskFAB({ projectId }: AddTaskFABProps) {
  const supabase = useSupabase()
  const user = useAuthStore((s) => s.user)
  const userId = user?.id ?? ''

  const { create } = useTaskMutations(supabase)
  const { data: projects = [] } = useProjects(supabase, userId)

  const [visible, setVisible] = useState(false)
  const [title, setTitle] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState(projectId ?? '')

  function handleAdd() {
    if (!title.trim() || !userId) return
    create.mutate(
      {
        title: title.trim(),
        user_id: userId,
        project_id: selectedProjectId || null,
        status: 'open',
        priority: 4,
      },
      {
        onSuccess: () => {
          setTitle('')
          setVisible(false)
        },
      }
    )
  }

  return (
    <>
      <TouchableOpacity style={styles.fab} onPress={() => setVisible(true)}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={() => setVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity style={styles.backdrop} onPress={() => setVisible(false)} />
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Ny uppgift</Text>

            <TextInput
              style={styles.input}
              placeholder="Vad behöver du göra?"
              value={title}
              onChangeText={setTitle}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleAdd}
            />

            {!projectId && projects.length > 0 && (
              <View style={styles.projectRow}>
                <Text style={styles.projectLabel}>Projekt</Text>
                <View style={styles.projectChips}>
                  <TouchableOpacity
                    style={[styles.chip, !selectedProjectId && styles.chipActive]}
                    onPress={() => setSelectedProjectId('')}
                  >
                    <Text style={[styles.chipText, !selectedProjectId && styles.chipTextActive]}>
                      Inkorg
                    </Text>
                  </TouchableOpacity>
                  {projects.map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      style={[styles.chip, selectedProjectId === p.id && styles.chipActive]}
                      onPress={() => setSelectedProjectId(p.id)}
                    >
                      <Text style={[styles.chipText, selectedProjectId === p.id && styles.chipTextActive]}>
                        {p.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[styles.addButton, !title.trim() && styles.addButtonDisabled]}
              onPress={handleAdd}
              disabled={!title.trim() || create.isPending}
            >
              {create.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.addButtonText}>Lägg till</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
  fabIcon: {
    color: '#fff',
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '300',
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    gap: 14,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
  },
  projectRow: {
    gap: 8,
  },
  projectLabel: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  projectChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    backgroundColor: '#F9F9F9',
  },
  chipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  chipText: {
    fontSize: 13,
    color: '#000',
  },
  chipTextActive: {
    color: '#fff',
  },
  addButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
