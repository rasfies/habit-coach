import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Platform,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { EmptyState } from "@/components/EmptyState";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { api } from "@/lib/api";

const COLORS = {
  primary: "#4F46E5",
  accent: "#FBBF24",
  background: "#F9FAFB",
  surface: "#FFFFFF",
  textPrimary: "#111827",
  textSecondary: "#6B7280",
  border: "#E5E7EB",
  error: "#EF4444",
};

interface GroupItem {
  id: string;
  name: string;
  invite_code: string;
  member_count: number;
  created_by: string;
  joined_at: string;
}

export default function GroupsTab() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [groups, setGroups] = useState<GroupItem[]>([]);

  // Modal state
  const [modalType, setModalType] = useState<"create" | "join" | null>(null);
  const [groupName, setGroupName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [modalLoading, setModalLoading] = useState(false);

  const loadGroups = useCallback(async () => {
    try {
      const res = await api.groups.list();
      if (res.ok) {
        const { groups: g } = await res.json();
        setGroups(g ?? []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const onRefresh = () => {
    setRefreshing(true);
    loadGroups();
  };

  async function handleCreateGroup() {
    if (!groupName.trim()) return;
    setModalLoading(true);
    try {
      const res = await api.groups.create(groupName.trim());
      if (res.ok) {
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        setModalType(null);
        setGroupName("");
        loadGroups();
      } else {
        Alert.alert("Error", "Could not create group. Please try again.");
      }
    } catch {
      Alert.alert("Error", "Could not create group. Please try again.");
    } finally {
      setModalLoading(false);
    }
  }

  async function handleJoinGroup() {
    if (!inviteCode.trim()) return;
    setModalLoading(true);
    try {
      const res = await api.groups.join(inviteCode.trim().toUpperCase());
      if (res.ok) {
        const data = await res.json();
        if (data.already_member) {
          Alert.alert("Already a member", `You're already in ${data.group_name}.`);
        } else {
          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          Alert.alert("Joined!", `Welcome to ${data.group_name}!`);
        }
        setModalType(null);
        setInviteCode("");
        loadGroups();
      } else {
        Alert.alert("Invalid code", "That invite code doesn't exist.");
      }
    } catch {
      Alert.alert("Error", "Could not join group. Please try again.");
    } finally {
      setModalLoading(false);
    }
  }

  function renderGroupCard({ item }: { item: GroupItem }) {
    return (
      <TouchableOpacity
        style={styles.groupCard}
        onPress={() => router.push(`/groups/${item.id}`)}
        activeOpacity={0.85}
      >
        <View style={styles.groupIconCircle}>
          <Text style={styles.groupIcon}>👥</Text>
        </View>
        <View style={styles.groupInfo}>
          <Text style={styles.groupName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.groupMeta}>
            {item.member_count} member{item.member_count !== 1 ? "s" : ""} · Code:{" "}
            <Text style={styles.inviteCodeText}>{item.invite_code}</Text>
          </Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
    );
  }

  if (loading) return <LoadingSpinner message="Loading groups…" />;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Groups</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setModalType("join")}
          >
            <Text style={styles.headerButtonText}>Join</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, styles.primaryHeaderButton]}
            onPress={() => setModalType("create")}
          >
            <Text style={styles.primaryHeaderButtonText}>+ Create</Text>
          </TouchableOpacity>
        </View>
      </View>

      {groups.length === 0 ? (
        <EmptyState
          icon="👥"
          title="No groups yet"
          subtitle="Create a group and invite friends. When they can see your streaks, you'll show up for yourself."
          ctaLabel="Create a Group"
          onCta={() => setModalType("create")}
        />
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          renderItem={renderGroupCard}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Create group modal */}
      <Modal
        visible={modalType === "create"}
        animationType="slide"
        transparent
        onRequestClose={() => setModalType(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Create a Group</Text>
            <Text style={styles.modalSubtitle}>
              You'll get an invite code to share with friends.
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Group name (e.g. Morning Warriors)"
              placeholderTextColor="#9CA3AF"
              value={groupName}
              onChangeText={setGroupName}
              autoCapitalize="words"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleCreateGroup}
            />
            <TouchableOpacity
              style={[
                styles.primaryButton,
                (!groupName.trim() || modalLoading) && styles.buttonDisabled,
              ]}
              onPress={handleCreateGroup}
              disabled={!groupName.trim() || modalLoading}
            >
              {modalLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Create Group</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setModalType(null)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Join group modal */}
      <Modal
        visible={modalType === "join"}
        animationType="slide"
        transparent
        onRequestClose={() => setModalType(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Join a Group</Text>
            <Text style={styles.modalSubtitle}>
              Enter the 6-character invite code from your friend.
            </Text>
            <TextInput
              style={[styles.modalInput, styles.codeInput]}
              placeholder="ABCD12"
              placeholderTextColor="#9CA3AF"
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="characters"
              maxLength={6}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleJoinGroup}
            />
            <TouchableOpacity
              style={[
                styles.primaryButton,
                (!inviteCode.trim() || modalLoading) && styles.buttonDisabled,
              ]}
              onPress={handleJoinGroup}
              disabled={!inviteCode.trim() || modalLoading}
            >
              {modalLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Join Group</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setModalType(null)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: { fontSize: 24, fontWeight: "700", color: COLORS.textPrimary },
  headerActions: { flexDirection: "row", gap: 8 },
  headerButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  headerButtonText: { fontSize: 14, color: COLORS.textPrimary, fontWeight: "500" },
  primaryHeaderButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  primaryHeaderButtonText: { fontSize: 14, color: "#fff", fontWeight: "600" },
  listContent: { paddingBottom: 40 },
  groupCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  groupIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  groupIcon: { fontSize: 22 },
  groupInfo: { flex: 1 },
  groupName: { fontSize: 16, fontWeight: "600", color: COLORS.textPrimary },
  groupMeta: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  inviteCodeText: { fontFamily: "JetBrainsMono-Regular", fontWeight: "700" },
  chevron: { fontSize: 22, color: COLORS.textSecondary },
  separator: { height: 1, backgroundColor: COLORS.border, marginLeft: 72 },
  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: { fontSize: 20, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 6 },
  modalSubtitle: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 20 },
  modalInput: {
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  codeInput: {
    letterSpacing: 4,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
  },
  primaryButton: {
    height: 52,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  buttonDisabled: { opacity: 0.5 },
  primaryButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  cancelButton: { paddingVertical: 12, alignItems: "center" },
  cancelButtonText: { fontSize: 15, color: COLORS.textSecondary },
});
