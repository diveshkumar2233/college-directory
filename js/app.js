let COLLEGES = [];

function feeText(fees){
  if(!fees) return null;
  const order = ["total","btech_total","mbbs_total","total_mbbs","per_year","mbbs_annual","total_bcom","total_ba","avg_annual","annual","bba_total","mca_total","mtech_total","bba","mba","bcom"];
  for(const k of order){
    if(fees[k]) return fees[k] + (k === "per_year" || k === "mbbs_annual" || k === "annual" ? " / yr" : "");
  }
  const keys = Object.keys(fees);
  if(keys.length) return fees[keys[0]];
  return null;
}

function courseList(c){
  const listed = c.courses || c.programs || c.specializations || [];
  const haystack = [c.name, c.eligibility, c.highlights, ...listed].filter(Boolean).join(" ").toLowerCase();
  const feeKeys = Object.keys(c.fees || {}).join(" ").toLowerCase();
  const inferred = [];

  // Some older directory entries only contain fee/eligibility information.
  // Infer their program type so the form can still find them.
  if(/\bb\.?(tech|e)\b|btech_total/.test(haystack + " " + feeKeys)) inferred.push("B.Tech");
  if(/\bm\.?(tech|e)\b|mtech_total/.test(haystack + " " + feeKeys)) inferred.push("M.Tech");
  if(/\bmbbs\b|medical|mbbs_/.test(haystack + " " + feeKeys)) inferred.push("MBBS");
  if(/\bmba\b|\bpgdm\b|management|\bmba_/.test(haystack + " " + feeKeys)) inferred.push("MBA");
  if(/\bbba\b|bba_/.test(haystack + " " + feeKeys)) inferred.push("BBA");
  if(/\bbca\b/.test(haystack)) inferred.push("BCA");
  if(/\bb\.?(com|commerce)\b|bcom_/.test(haystack + " " + feeKeys)) inferred.push("B.Com");
  if(/\bba\b|arts|liberal|total_ba/.test(haystack + " " + feeKeys)) inferred.push("BA");
  if(/\blaw\b/.test(haystack)) inferred.push("Law");
  if(/hospitality|hotel management/.test(haystack)) inferred.push("Hospitality");

  return [...new Set([...listed, ...inferred])];
}

function textForCollege(c){
  return [c.name, c.location, c.eligibility, c.highlights, ...courseList(c)]
    .filter(Boolean).join(" ").toLowerCase();
}

function feeStartingAmount(c){
  const fee = feeText(c.fees);
  if(!fee) return null;
  const normalized = fee.toLowerCase().replace(/,/g, "");
  const values = normalized.match(/\d+(?:\.\d+)?/g);
  if(!values || !values.length) return null;
  const lowest = Math.min(...values.map(Number));
  if(/lakh/.test(normalized)) return lowest;
  if(/k\b/.test(normalized)) return lowest / 100;
  // A number without a unit (for example, 79400) is assumed to be rupees.
  return lowest >= 1000 ? lowest / 100000 : lowest;
}

function renderCard(c){
  const fee = feeText(c.fees);
  const courses = courseList(c);
  const tagsHtml = courses.slice(0,4).map(t => `<span class="tag">${t}</span>`).join("");
  return `
    <div class="card">
      <p class="loc">${c.location || ""}</p>
      <h2>${c.name}</h2>
      ${fee ? `<span class="fee-tag">${fee}</span>` : ""}
      ${c.eligibility ? `<div class="row"><span class="k">Eligibility</span><span class="v">${c.eligibility}</span></div>` : ""}
      ${tagsHtml ? `<div class="tags">${tagsHtml}</div>` : ""}
      ${c.highlights ? `<p class="highlight">${c.highlights}</p>` : ""}
    </div>
  `;
}

function populateLocations(){
  const locs = Array.from(new Set(COLLEGES.map(c => c.location).filter(Boolean))).sort();
  const select = document.getElementById("locationFilter");
  locs.forEach(loc => {
    const option = document.createElement("option");
    option.value = loc;
    option.textContent = loc;
    select.appendChild(option);
  });
}

function setupLocationSelect(onChange){
  if(!window.jQuery || !window.jQuery.fn.select2) return;
  const $location = window.jQuery("#locationFilter");
  const formatLocation = state => {
    if(!state.id) return state.text;
    return window.jQuery("<span class='location-result'><span class='location-pin' aria-hidden='true'>⌖</span></span>")
      .append(document.createTextNode(state.text));
  };

  $location.select2({
    placeholder: "Search or select location (optional)",
    allowClear: true,
    width: "100%",
    templateResult: formatLocation,
    templateSelection: formatLocation
  }).on("select2:select select2:clear", onChange);
}

function clearResults(){
  const grid = document.getElementById("grid");
  grid.innerHTML = "";
  grid.hidden = true;
  document.getElementById("emptyState").style.display = "none";
  document.getElementById("resultCount").textContent = "";
  document.getElementById("resultSummary").hidden = true;
}

function renderResults(matches){
  const grid = document.getElementById("grid");
  const empty = document.getElementById("emptyState");
  const msg = document.getElementById("formMsg");

  document.getElementById("resultSummary").hidden = false;
  document.getElementById("resultCount").textContent = `${matches.length} of ${COLLEGES.length} colleges`;
  empty.style.display = matches.length ? "none" : "block";
  grid.hidden = !matches.length;
  grid.innerHTML = matches.map(renderCard).join("");

  if(msg){
    if(matches.length === 0){
      msg.textContent = "No colleges matched your selections — try loosening a filter (e.g. remove budget or location).";
      msg.style.color = "#a53a3a";
    } else {
      msg.textContent = `Found ${matches.length} matching college${matches.length === 1 ? "" : "s"} — shown below.`;
      msg.style.color = "";
    }
  }
}

function applyMatchmakerFilters(scroll){
  const program = document.getElementById("programFilter").value.toLowerCase();
  const location = document.getElementById("locationFilter").value;
  const budget = Number(document.getElementById("budgetFilter").value);
  const admission = document.getElementById("admissionFilter").value.toLowerCase();

  let matches = COLLEGES.filter(c => {
    const text = textForCollege(c);
    const fee = feeStartingAmount(c);
    return (!program || text.includes(program)) &&
      (!location || c.location === location) &&
      (!budget || fee === null || fee <= budget) &&
      (!admission || text.includes(admission));
  });

  let fallbackMessage = "";
  if(!matches.length && (budget || admission)){
    // Budget and admission style are preferences, so keep useful results
    // visible when their combination is more restrictive than the data.
    matches = COLLEGES.filter(c => {
      const text = textForCollege(c);
      return (!program || text.includes(program)) &&
        (!location || c.location === location);
    });
    if(matches.length){
      fallbackMessage = `No exact budget/admission match found. Showing ${matches.length} college${matches.length === 1 ? "" : "s"} for your program and location.`;
    }
  }

  renderResults(matches);
  if(fallbackMessage){
    const msg = document.getElementById("formMsg");
    msg.textContent = fallbackMessage;
    msg.style.color = "#6b6455";
  }

  if(scroll){
    document.getElementById("grid").scrollIntoView({behavior:"smooth", block:"start"});
  }
}

async function init(){
  const loadingEl = document.getElementById("loadingState");
  try{
    const res = await fetch("data/colleges.json");
    if(!res.ok) throw new Error("Failed to load data/colleges.json");
    COLLEGES = await res.json();
    loadingEl.style.display = "none";
    populateLocations();
    clearResults(); // Results are shown only after the visitor submits the form.
    document.getElementById("formMsg").textContent = "Select a course to generate your college list.";

    const form = document.getElementById("matchmakerForm");
    const updateResultsFromForm = () => {
      if(document.getElementById("programFilter").value){
        applyMatchmakerFilters(false);
      } else {
        clearResults();
        document.getElementById("formMsg").textContent = "Select a course to generate your college list.";
      }
    };

    setupLocationSelect(updateResultsFromForm);

    form.addEventListener("submit", event => {
      event.preventDefault();
      applyMatchmakerFilters(true);
    });
    form.querySelectorAll("select, input").forEach(field => {
      field.addEventListener("change", updateResultsFromForm);
    });
  } catch(err){
    loadingEl.textContent = "Could not load college data. Make sure you're running this via a local server (see README), not by double-clicking the file.";
    console.error(err);
  }
}

init();
