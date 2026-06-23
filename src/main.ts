import { detectSite } from './site';
import { TabLeader } from './utils/tabLeader';
import { Logger } from './utils/logger';
import Panel from './ui/panel/panel';
import { NavBarEnergy } from './ui/nav/nav-bar-energy';
import { Network } from './utils/network';

if (!detectSite()) {
  throw new Error('NLStatus Pro: unsupported site');
}

async function startup(): Promise<void> {
  TabLeader.init();

  let panel: Panel | undefined;
  try {
    panel = new Panel();
  } catch (e) {
    Logger.error('Panel initialization failed:', e);
    return;
  }

  // Inject navbar energy value
  const navObserver = new MutationObserver(() => {
    const navBar = document.querySelector('ul.d-header-icons');
    if (navBar) {
      navObserver.disconnect();
      const network = new Network();
      const navEnergy = new NavBarEnergy(network);
      navEnergy.inject();
      navEnergy.startAutoRefresh();

      // Keep reference alive for cleanup
      const unload = () => {
        navEnergy.stop();
        window.removeEventListener('beforeunload', unload);
      };
      window.addEventListener('beforeunload', unload);
    }
  });
  navObserver.observe(document.body, { childList: true, subtree: true });

  // Set up cleanup on page navigation (Discourse SPA)
  let lastUrl = location.href;
  const navigationCheck = setInterval(() => {
    if (lastUrl !== location.href) {
      lastUrl = location.href;
      // Re-inject if needed
      if (panel && !panel.isMounted()) {
        // Panel was removed by Discourse's page transition
        Logger.log('Panel removed by page transition, but instance retained');
      }
    }
  }, 5000);

  window.addEventListener('beforeunload', () => {
    clearInterval(navigationCheck);
    panel?.destroy();
  });
}

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startup);
} else {
  startup();
}
