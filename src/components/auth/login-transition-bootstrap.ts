// Non-sensitive handoff only: no form values or DOM are persisted.
export const loginTransitionBootstrap = `(function(){try{var t=Number(sessionStorage.getItem('permission-next-login-transition'));if(t>0&&Date.now()>=t&&Date.now()-t<60000&&location.pathname!=='/login')document.documentElement.dataset.loginArrival='preparing'}catch(e){}})();`;
