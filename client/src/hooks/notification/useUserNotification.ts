// "use client";

// import { useQuery, useMutation, useQueryClient, keepPreviousData, } from "@tanstack/react-query";
// import { useState, useCallback, useMemo, useEffect } from "react";
// import toast from "react-hot-toast";
// import { NotificationType, PaginationResponse } from "@/lib/types";
// import notificationsApi from "@/lib/api";
// import { socketClientUtils } from "@/lib/utils";
// import { useAuth } from "@/hooks/auth/useAuth"; // ✅ auto-detect user

// export const useUserNotification = () => {
//   const { user, isAuthenticated } = useAuth(); // ✅ get current logged-in user
//   const userId = user?._id;
//   const queryClient = useQueryClient();

//   const [selectedNotification, setSelectedNotification] =
//     useState<NotificationType | null>(null);
//   const [pagination, setPagination] = useState<PaginationResponse | null>(null);
//   const [unreadCount, setUnreadCount] = useState<number | null>(null);

//   // -------------------- FETCH USER NOTIFICATIONS --------------------
//   const {
//     data: notifications = [],
//     isLoading: isLoadingNotifications,
//     error: notificationsError,
//     refetch: refetchNotifications,
//   } = useQuery({
//     queryKey: ["user", "notifications", userId],
//     queryFn: async () => {
//       if (!userId) return [];
//       const res = await notificationsApi.getById(userId);
//       setUnreadCount(res?.data?.unreadCount ?? null);
//       return res?.data?.notifications || [];
//     },
//     enabled: !!userId && isAuthenticated,
//     refetchOnWindowFocus: false,
//     placeholderData: keepPreviousData,
//   });

//   // -------------------- SOCKET SETUP --------------------
//   useEffect(() => {
//     if (!userId) return;

//     const socket = socketClientUtils.getSocket();

//     // ✅ Join room for current user
//     socketClientUtils.joinRoom(`user:${userId}`);

//     const handleNotification = (notification: NotificationType) => {
//       // console.log("🔔 New notification received:", notification);
//       refetchNotifications();
//       setUnreadCount((prev) => (prev ?? 0) + 1);

//       toast.success(notification.title, {
//         icon: "🔔",
//         duration: 4000,
//       });

//       // Optionally trigger event for global listeners
//       if (typeof window !== "undefined") {
//         window.dispatchEvent(
//           new CustomEvent("new-notification", { detail: notification })
//         );
//       }
//     };

//     socket.on("notification:new", handleNotification);

//     return () => {
//       socket.off("notification:new", handleNotification);
//       socketClientUtils.leaveRoom(`user:${userId}`);
//     };
//   }, [refetchNotifications]);

//   // -------------------- MUTATIONS --------------------
//   const deleteUserNotificationMutation = useMutation({
//     mutationFn: (id: string) => notificationsApi.delete(id),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ["user", "notifications"] });
//       toast.success("Notification deleted");
//     },
//     onError: (error) => {
//       console.error("❌ Error deleting notification:", error);
//       toast.error("Failed to delete notification");
//     },
//   });

//   const markAllReadMutation = useMutation({
//     mutationFn: () => notificationsApi.markAllRead("user", userId),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ["user", "notifications"] });
//       setUnreadCount(0);
//     },
//     onError: (error) => {
//       console.error("❌ Error marking all read:", error);
//       toast.error("Failed to mark all as read");
//     },
//   });

//   // -------------------- HELPERS --------------------
//   const getNotificationByIdUser = useCallback(async (id: string) => {
//     try {
//       const res = await notificationsApi.getById(id);
//       // Assuming the API returns { unreadCount, notifications }
//       const notiData = res?.data?.notifications?.[0] ?? null;
//       if (notiData) setSelectedNotification(notiData);
//       return notiData;
//     } catch (error) {
//       console.error("Error fetching notification by ID:", error);
//       throw error;
//     }
//   }, []);

//   // -------------------- COMPUTED --------------------
//   const isMutating = useMemo(
//     () =>
//       deleteUserNotificationMutation.isPending || markAllReadMutation.isPending,
//     [deleteUserNotificationMutation.isPending, markAllReadMutation.isPending]
//   );

//   return {
//     // Data
//     notifications,
//     pagination,
//     selectedNotification,

//     // State
//     unreadCount,
//     setSelectedNotification,
//     clearSelectedNotification: () => setSelectedNotification(null),

//     // Status
//     isLoadingNotifications,
//     isMutating,
//     notificationsError,

//     // Actions
//     refetchNotifications,
//     getNotificationByIdUser,
//     mutations: {
//       delete: deleteUserNotificationMutation,
//       markAllRead: markAllReadMutation,
//     },

//     // Computed
//     totalNotifications: notifications?.length,
//   };
// };
