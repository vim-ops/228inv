import { Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "@/components/ui/toaster";
import { queryClient } from "@/lib/queryClient";
import { Sidebar, SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import Navigation from "@/components/Navigation";
import DashboardPage from "@/pages/dashboard";
import InventoryPage from "@/pages/inventory/[product]";
import InboundPage from "@/pages/inbound/[product]";
import OutboundPage from "@/pages/outbound/[product]";
import HistoryPage from "@/pages/history/[product]";

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SidebarProvider>
        <Sidebar>
          <Navigation />
        </Sidebar>
        <SidebarInset>
          <Route path="/" component={DashboardPage} />
          <Route path="/inventory/:product" component={InventoryPage} />
          <Route path="/inbound/:product" component={InboundPage} />
          <Route path="/outbound/:product" component={OutboundPage} />
          <Route path="/history/:product" component={HistoryPage} />
        </SidebarInset>
        <Toaster />
        <ReactQueryDevtools initialIsOpen={false} />
      </SidebarProvider>
    </QueryClientProvider>
  );
}
