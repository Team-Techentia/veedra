// "use client";

// import { useEffect, useRef, useState } from "react";
// import { Bell, CheckCircle, Trash2 } from "lucide-react";
// import { useAdminNotification } from "@/hooks";

// export const AdminNotificationBell = () => {
//   const audioRef = useRef<HTMLAudioElement | null>(null);
//   const [open, setOpen] = useState(false);

//   const {
//     notifications,
//     unreadCount,
//     mutations: { markAllRead, delete: deleteNotifications },
//   } = useAdminNotification();

//   useEffect(() => {
//     const handleNewNotification = (e: CustomEvent) => {
//       playSound();
//       showBrowserNotification(e.detail);
//     };

//     window.addEventListener(
//       "new-notification",
//       handleNewNotification as EventListener
//     );

//     return () =>
//       window.removeEventListener(
//         "new-notification",
//         handleNewNotification as EventListener
//       );
//   }, []);

//   const playSound = () => {
//     if (!audioRef.current) audioRef.current = new Audio("/notification.mp3");
//     audioRef.current.play().catch(() => { });
//   };

//   const showBrowserNotification = (notification: any) => {
//     if ("Notification" in window && Notification.permission === "granted") {
//       new Notification(notification?.title || "New Notification", {
//         body: notification?.body || "",
//         icon: "/bell.png",
//       });
//     }
//   };

//   useEffect(() => {
//     if ("Notification" in window && Notification.permission !== "granted") {
//       Notification.requestPermission();
//     }
//   }, []);

//   // 🔥 CLOSE ON OUTSIDE CLICK
//   useEffect(() => {
//     const handleOutside = () => setOpen(false);
//     window.addEventListener("click", handleOutside);
//     return () => window.removeEventListener("click", handleOutside);
//   }, []);

//   return (
//     <div
//       className="relative"
//       onClick={(e) => e.stopPropagation()} // prevents inside clicks from closing
//     >
//       <button
//         onClick={(e) => {
//           e.stopPropagation(); // prevent toggle conflict
//           setOpen(!open);
//         }}
//         className="relative p-2 rounded-full hover:bg-gray-100 transition"
//       >
//         <Bell className="w-6 h-6 text-gray-700" />

//         {unreadCount > 0 && (
//           <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
//             {unreadCount > 99 ? "99+" : unreadCount}
//           </span>
//         )}
//       </button>

//       {open && (
//         <div
//           className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-lg border border-gray-200 z-50"
//           onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside box
//         >
//           <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
//             <h4 className="text-sm font-semibold text-gray-800">
//               Notifications
//             </h4>
//             <div className="flex gap-2">
//               <button
//                 onClick={() => markAllRead.mutate()}
//                 disabled={markAllRead.isPending}
//                 className="text-xs text-blue-600 hover:underline flex items-center gap-1"
//               >
//                 <CheckCircle size={14} /> Mark all read
//               </button>

//               <button
//                 onClick={() => deleteNotifications}
//                 className="text-xs text-gray-500 hover:text-red-500 flex items-center gap-1"
//               >
//                 <Trash2 size={14} /> Clear
//               </button>
//             </div>
//           </div>

//           <div className="max-h-96 overflow-y-auto">
//             {(notifications as any)?.length === 0 && (
//               <p className="text-gray-500 text-sm text-center py-6">
//                 No notifications yet
//               </p>
//             )}

//             {(notifications as any)?.map((n: any) => (
//               <div
//                 key={n._id}
//                 className={`px-4 py-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition ${!n.read ? "bg-gray-50" : ""
//                   }`}
//               >
//                 <h5 className="text-sm font-medium text-gray-900">{n.title}</h5>
//                 <p className="text-xs text-gray-600">{n.body}</p>
//                 <p className="text-[10px] text-gray-400 mt-1">
//                   {new Date(n?.createdAt ?? "").toLocaleString()}
//                 </p>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };
