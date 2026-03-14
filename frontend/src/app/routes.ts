import { createBrowserRouter } from "react-router";
import Root from "./components/Root";
import Home from "./pages/Home";
import Search from "./pages/Search";
import ListingDetail from "./pages/ListingDetail";
import PostListing from "./pages/PostListing";
import Inbox from "./pages/Inbox";
import Chat from "./pages/Chat";
import MyBookings from "./pages/MyBookings";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Landing from "./pages/Landing";
import SignUp from "./pages/SignUp";
import NotFound from "./pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Landing },
      { path: "signup", Component: SignUp },
      { path: "home", Component: Home },
      { path: "search", Component: Search },
      { path: "listing/:id", Component: ListingDetail },
      { path: "post", Component: PostListing },
      { path: "inbox", Component: Inbox },
      { path: "chat/:id", Component: Chat },
      { path: "bookings", Component: MyBookings },
      { path: "profile/:id", Component: Profile },
      { path: "settings", Component: Settings },
      { path: "*", Component: NotFound }
    ]
  }
]);
