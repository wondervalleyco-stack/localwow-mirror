// ----------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------
// -----------------          CREATOR DASHBOARD ON DOM LOADED     -------------------------
// ----------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------
// --------                                                                        --------
// --------  1. is this /creator-dashboard? (CSSID = CREATOR_DASHBOARD)   -----------------
// --------                                                                        --------
// --------  2. who opened it?   is it a loged-in creator? (by COOKIE)             --------
// --------                                                                        --------
// --------  3. LOAD: CREATOR | ELEMENTS | EVENTS | COLLECTIONS into front end     --------
// --------                                                                        --------
// --------  4. RENDER: SHELL + [ELEMENTS,EVENTS,COLLECTIONS,ACCOUNTS]             --------
// --------                                                                        --------
// --------  5. WAIT FOR USER ACTIONS                                              --------
// --------                                                                        --------
// ----------------------------------------------------------------------------------------
//
//
// ------------------------------------------------------------
// Logging (info only). Flip to false when stable.
// ------------------------------------------------------------ 

const LOG = true;

function logsInDash(msg, obj) 
{
  if (!LOG) return;

  if (obj !== undefined) 
    {
      console.log(`[WOW][dashboard] ${msg}`, obj);
    } else 
        {
          console.log(`[WOW][dashboard] ${msg}`);
        }
}

// ------------------------------------------------------------
// ------------------------------------------------------------
// ON DOM LOADED 
// ------------------------------------------------------------ 
// ------------------------------------------------------------

document.addEventListener('DOMContentLoaded', async function () 
{
  logsInDash('DOMContentLoaded ENTER');
  
    // ------------------------------------------------------------
    //                is this '/creator-dashboard'?
    // ------------------------------------------------------------ 
    const cssidCheck = document.getElementById('CREATOR_DASHBOARD');
    if (!cssidCheck) 
      {
        logsInDash(`OnDomLoaded EXIT — container CREATOR_DASHBOARD not found`);
        return;
      }

    // ------------------------------------------------------------
    //           CHECK FOR COOKIE:
    //           if no cookie - redirect to creator login
    //           if yes cookie - save the creator details
    // ------------------------------------------------------------ 
    window.creator = {};
    let creatorData = null;

    try 
      {
        const creatorDataResult = await fetch(`/wp-json/wow/v1/me`, 
          {
            method: 'GET',
            credentials: 'same-origin',
            headers: { 'Accept': 'application/json' }
          });

        if (!creatorDataResult.ok) 
          {
            logsInDash('creator not authorized, redirecting', { status: creatorDataResult.status });
            window.location.replace('/creator-login');
            return null;
          }

        creatorData = await creatorDataResult.json();
        window.creator.creator_id   = creatorData.creator_id;
        window.creator.email        = creatorData.email;
        window.creator.account_name = creatorData.account_name;
        window.creator.owner_name   = creatorData.owner_name;
      } 
    catch (err) 
      {
        console.error('⚠️ Network or JSON error', err);
        logsInDash('fetch(/me) failed, likely network issue');
        return;
      }

 
    // ---------------------------------------------------------------
    //        load creator dashboard v1 data
    //        load all elements(created + imported)
    //        load all events(created + participating in)
    //        load all collections(created + participating in)
    // --------------------------------------------------------------- 


    // here we will have an await for the loading of all table contents
   



    // ---------------------------------------------------------------
    //  RENDER CREATOR DASHBOARD PAGE
    // ---------------------------------------------------------------

    renderPageChrome();

    const mount = document.getElementById('CREATOR_DASHBOARD');

    renderTopbar(mount, window.creator);

    renderHero(mount, window.creator);

    renderDashboardGrid(mount);












    logsInDash('DOMContentLoaded EXIT');
});
