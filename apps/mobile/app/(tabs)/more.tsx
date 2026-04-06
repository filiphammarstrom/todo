import { View, SectionList, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSomedayTasks, useProjects, useAreas, useTaskMutations } from '@todo/store'
import { useSupabase } from '../../src/context/SupabaseContext'
import { useAuthStore } from '@todo/store'
import TaskRow from '../../src/components/TaskRow'

export default function MoreScreen() {
  const router = useRouter()
  const supabase = useSupabase()
  const user = useAuthStore((s) => s.user)
  const userId = user?.id ?? ''

  const { data: somedayTasks = [], isLoading: loadingSomeday } = useSomedayTasks(supabase, userId)
  const { data: projects = [], isLoading: loadingProjects } = useProjects(supabase, userId)
  const { data: areas = [], isLoading: loadingAreas } = useAreas(supabase, userId)
  const { complete } = useTaskMutations(supabase)

  const isLoading = loadingSomeday || loadingProjects || loadingAreas

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    )
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <SectionList
      style={styles.container}
      sections={[
        {
          title: 'Projekt',
          data: projects,
          renderItem: ({ item }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() => router.push(`/project/${item.id}`)}
            >
              <View style={[styles.colorDot, { backgroundColor: item.color ?? '#8E8E93' }]} />
              <Text style={styles.rowText}>{item.name}</Text>
              <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
            </TouchableOpacity>
          ),
        },
        {
          title: 'Områden',
          data: areas,
          renderItem: ({ item }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() => router.push(`/area/${item.id}`)}
            >
              <View style={[styles.colorDot, { backgroundColor: item.color ?? '#8E8E93' }]} />
              <Text style={styles.rowText}>{item.name}</Text>
              <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
            </TouchableOpacity>
          ),
        },
        {
          title: 'Someday',
          data: somedayTasks,
          renderItem: ({ item }) => (
            <TaskRow
              task={item}
              onComplete={(id) => complete.mutate(id)}
            />
          ),
        },
        {
          title: 'Konto',
          data: [{ id: 'signout', name: 'Logga ut' }],
          renderItem: () => (
            <TouchableOpacity style={styles.row} onPress={handleSignOut}>
              <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
              <Text style={[styles.rowText, styles.signOutText]}>Logga ut</Text>
            </TouchableOpacity>
          ),
        },
      ]}
      keyExtractor={(item) => item.id}
      renderSectionHeader={({ section }) => (
        <Text style={styles.sectionHeader}>{section.title}</Text>
      )}
    />
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    backgroundColor: '#F2F2F7',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
    gap: 12,
  },
  rowText: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  signOutText: {
    color: '#FF3B30',
  },
})
