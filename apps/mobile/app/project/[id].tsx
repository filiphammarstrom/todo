import { View, FlatList, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useProjectTasks, useTaskMutations } from '@todo/store'
import { useSupabase } from '../../src/context/SupabaseContext'
import TaskRow from '../../src/components/TaskRow'
import AddTaskFAB from '../../src/components/AddTaskFAB'

export default function ProjectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const supabase = useSupabase()

  const { data: tasks = [], isLoading } = useProjectTasks(supabase, id!)
  const { complete } = useTaskMutations(supabase)

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {tasks.length === 0 ? (
        <Text style={styles.empty}>Inga uppgifter i projektet</Text>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(t) => t.id}
          renderItem={({ item }) => (
            <TaskRow
              task={item}
              onComplete={(tid) => complete.mutate(tid)}
            />
          )}
        />
      )}
      <AddTaskFAB projectId={id} />
    </View>
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
  empty: {
    textAlign: 'center',
    color: '#8E8E93',
    marginTop: 60,
    fontSize: 16,
  },
})
