// LinkWash link cleaner. Pure: no DOM, no chrome.* APIs.
// Loaded by the content script, the service worker (importScripts) and Node tests.

const LinkWash = (() => {
  // Tracking params removed on every site.
  const GLOBAL_PARAMS = new Set([
    "fbclid", "gclid", "gclsrc", "dclid", "gbraid", "wbraid", "msclkid", "yclid",
    "twclid", "ttclid", "li_fat_id", "epik", "rdt_cid", "irclickid", "srsltid",
    "mc_cid", "mc_eid", "_hsenc", "_hsmi", "__hssc", "__hstc", "__hsfp", "hsctatracking",
    "mkt_tok", "igshid", "igsh", "_ga", "_gl", "vero_id", "vero_conv", "oly_anon_id",
    "oly_enc_id", "rb_clickid", "s_cid", "wickedid", "ref_src", "ref_url",
    "spm", "scm", "cmpid", "sc_cid", "trk", "trkcampaign", "trackingid",
  ]);
  // Any param starting with one of these is tracking.
  const GLOBAL_PREFIXES = ["utm_", "pk_", "mtm_", "hsa_", "pf_rd_", "pd_rd_"];

  // Per-site rules. `hosts` matches the hostname or any subdomain of it.
  // `strip`: extra params to remove. `keep`: if set, remove every param not listed.
  const SITES = [
    { hosts: ["x.com", "twitter.com"], keep: [] , paths: /^\/[^/]+\/status\// },
    { hosts: ["x.com", "twitter.com"], strip: ["s", "t", "a"] },
    { hosts: ["youtube.com"], keep: ["v", "t", "list", "index", "search_query", "start", "end"], paths: /^\/(watch|playlist|results|shorts\/|live\/|embed\/|@)/ },
    { hosts: ["youtu.be"], keep: ["t", "list", "index"] },
    { hosts: ["open.spotify.com"], strip: ["si", "nd", "dl_branch", "_branch_match_id", "_branch_referrer"] },
    { hosts: ["music.apple.com", "podcasts.apple.com"], strip: ["ls", "uo", "at", "ct", "itsct", "itscg"] },
    { hosts: ["instagram.com"], strip: ["img_index_utm", "ig_rid", "ig_mid"] },
    { hosts: ["tiktok.com"], strip: ["_r", "_t", "is_from_webapp", "sender_device", "sender_web_id", "share_app_id", "share_item_id", "share_link_id", "social_sharing", "tt_from", "u_code", "timestamp", "user_id", "sec_user_id", "checksum", "preview_pb", "web_id", "enter_from", "refer", "lang"] },
    { hosts: ["reddit.com"], strip: ["share_id", "rdt", "ref", "ref_source", "ref_campaign", "$deep_link", "correlation_id", "post_fullname", "post_index"] },
    { hosts: ["linkedin.com"], strip: ["lipi", "licu", "originalsubdomain", "rcm", "refid", "midtoken", "midsig", "eid", "otptoken", "trkemail", "lgtrk", "uid"] },
    { hosts: ["facebook.com"], strip: ["mibextid", "rdid", "__cft__", "__tn__", "comment_tracking", "hc_ref", "fref", "ref", "sfnsn", "extid", "paipv"] },
    { hosts: ["threads.net", "threads.com"], strip: ["xmt", "slof"] },
    { hosts: ["google.com"], strip: ["ved", "ei", "sa", "usg", "oq", "gs_lcrp", "gs_lp", "sclient", "sxsrf", "sourceid", "uact", "bih", "biw", "rlz", "aqs", "iflsig", "sca_esv", "sca_upv", "client", "dpr", "fbs", "source", "ie", "cd", "cad"], paths: /^\/(search|url)/ },
    { hosts: ["bing.com"], strip: ["form", "qs", "pq", "sc", "sk", "cvid", "ghsh", "ghacc", "ghpl", "ghc"] },
    { hosts: ["ebay.com"], strip: ["_trkparms", "_trksid", "amdata", "hash", "mkevt", "mkcid", "mkrid", "campid", "toolid", "customid", "_from", "_skw"] },
    { hosts: ["aliexpress.com"], strip: ["spm", "scm", "pvid", "algo_pvid", "algo_exp_id", "btsid", "ws_ab_test", "aff_fcid", "aff_fsk", "aff_platform", "sk", "aff_trace_key", "terminal_id", "afsmartredirect", "gatewayadapt"] },
    { hosts: ["medium.com"], strip: ["source", "sk"] },
    { hosts: ["substack.com"], strip: ["r", "showWelcome", "triedRedirect", "triedredirect", "publication_id", "post_id", "isFreemail"] },
  ];

  const AMAZON_HOST = /(^|\.)amazon\.(com|ca|com\.mx|com\.br|co\.uk|de|fr|it|es|nl|se|pl|com\.be|ie|in|co\.jp|com\.au|sg|ae|sa|eg|com\.tr)$/;
  const AMAZON_PRODUCT = /\/(?:dp|gp\/product|gp\/aw\/d)\/([A-Z0-9]{10})(?=[/?#]|$)/i;
  const AMAZON_STRIP = ["ref", "ref_", "tag", "linkcode", "linkid", "camp", "creative", "creativeasin", "ascsubtag", "qid", "sr", "crid", "sprefix", "keywords", "dib", "dib_tag", "psc", "th", "smid", "content-id", "social_share", "starsleft", "pd_rd_w", "pd_rd_wg", "pd_rd_r", "pd_rd_i", "_encoding", "dchild", "spia", "sp_csd", "spla"];

  function hostMatches(hostname, hosts) {
    return hosts.some((h) => hostname === h || hostname.endsWith("." + h));
  }

  function isTracking(name, extra) {
    const n = name.toLowerCase();
    if (GLOBAL_PARAMS.has(n) || extra.has(n)) return true;
    return GLOBAL_PREFIXES.some((p) => n.startsWith(p));
  }

  // Returns the cleaned URL string, or the input unchanged when nothing needs removing.
  function cleanUrl(input) {
    if (typeof input !== "string") return input;
    const raw = input.trim();
    if (!/^https?:\/\/\S+$/i.test(raw)) return input;

    let url;
    try {
      url = new URL(raw);
    } catch {
      return input;
    }
    const host = url.hostname.toLowerCase();

    // Amazon product pages: keep only /dp/ASIN.
    if (AMAZON_HOST.test(host)) {
      const m = url.pathname.match(AMAZON_PRODUCT);
      if (m) {
        const clean = `${url.protocol}//${url.host}/dp/${m[1].toUpperCase()}${url.hash}`;
        return clean === raw ? input : clean;
      }
    }

    const extra = new Set();
    let keep = null;
    if (AMAZON_HOST.test(host)) AMAZON_STRIP.forEach((p) => extra.add(p));
    for (const rule of SITES) {
      if (!hostMatches(host, rule.hosts)) continue;
      if (rule.paths && !rule.paths.test(url.pathname)) continue;
      if (rule.keep) {
        keep = new Set(rule.keep.map((p) => p.toLowerCase()));
        break;
      }
      rule.strip.forEach((p) => extra.add(p.toLowerCase()));
    }

    const names = [...new Set([...url.searchParams.keys()])];
    let changed = false;
    for (const name of names) {
      const drop = keep ? !keep.has(name.toLowerCase()) : isTracking(name, extra);
      if (drop) {
        url.searchParams.delete(name);
        changed = true;
      }
    }

    // utm_* hiding in the fragment (#utm_source=...)
    if (/^#.*\butm_[a-z]+=/i.test(url.hash) && !url.hash.includes("/")) {
      const frag = new URLSearchParams(url.hash.slice(1));
      for (const name of [...new Set(frag.keys())]) {
        if (isTracking(name, extra)) frag.delete(name);
      }
      const rest = frag.toString();
      url.hash = rest ? "#" + rest : "";
      changed = true;
    }

    if (!changed) return input;
    let out = url.toString();
    // URL leaves a bare "?" or "#" behind when everything was removed.
    out = out.replace(/\?(?=#|$)/, "").replace(/#$/, "");
    return out === raw ? input : out;
  }

  // True when the text is a single link (what someone copies from a share button).
  function isSingleUrl(text) {
    return typeof text === "string" && /^https?:\/\/\S+$/i.test(text.trim());
  }

  return { cleanUrl, isSingleUrl };
})();

if (typeof module !== "undefined" && module.exports) module.exports = LinkWash;
