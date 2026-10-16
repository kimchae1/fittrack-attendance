const KEY = "fittrack_gym_members_v1";

class GymMember {
  constructor(
    id,
    name,
    status = "Outside",
    lastAction = "Not checked in yet"
  ) {
    this.id = id.trim().toUpperCase();
    this.name = name.trim();
    this.status = status;
    this.lastAction = lastAction;
  }

  timeNow() {
    return new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  checkIn() {
    if (this.status === "Inside") {
      return {
        success: false,
        message: `${this.name} is already marked Inside.`
      };
    }

    this.status = "Inside";
    this.lastAction = `Checked in · ${this.timeNow()}`;

    return {
      success: true,
      message: `${this.name} checked in successfully.`
    };
  }

  checkOut() {
    if (this.status === "Outside") {
      return {
        success: false,
        message: `${this.name} is already marked Outside.`
      };
    }

    this.status = "Outside";
    this.lastAction = `Checked out · ${this.timeNow()}`;

    return {
      success: true,
      message: `${this.name} checked out successfully.`
    };
  }
}

const samples = [
  new GymMember(
    "M-001",
    "Bea Lim",
    "Inside",
    "Checked in · 08:15 AM"
  ),
  new GymMember(
    "M-002",
    "Ken Yu",
    "Outside",
    "Checked out · 07:42 AM"
  )
];

let members = load();
let timer;

const form = document.querySelector("#memberForm");
const idInput = document.querySelector("#memberId");
const nameInput = document.querySelector("#memberName");
const search = document.querySelector("#searchInput");
const filter = document.querySelector("#statusFilter");
const tbody = document.querySelector("#memberTableBody");
const empty = document.querySelector("#emptyState");
const toast = document.querySelector("#toast");

function load() {
  try {
    const data = localStorage.getItem(KEY);

    if (data !== null) {
      const arr = JSON.parse(data);

      if (Array.isArray(arr)) {
        return arr.map(
          m => new GymMember(
            m.id,
            m.name,
            m.status,
            m.lastAction
          )
        );
      }
    }
  } catch (e) {
    console.warn(e);
  }

  return samples.map(
    m => new GymMember(
      m.id,
      m.name,
      m.status,
      m.lastAction
    )
  );
}

function save() {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify(members)
    );
  } catch (e) {
    notify(
      "Could not save records in this browser.",
      true
    );
  }
}

function esc(v) {
  return String(v).replace(
    /[&<>"']/g,
    c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[c]
  );
}

function render() {
  const q = search.value.trim().toLowerCase();
  const f = filter.value;

  const shown = members.filter(
    m =>
      (
        m.id.toLowerCase().includes(q) ||
        m.name.toLowerCase().includes(q)
      ) &&
      (f === "All" || m.status === f)
  );

  document.querySelector("#totalMembers").textContent =
    members.length;

  document.querySelector("#insideCount").textContent =
    members.filter(
      m => m.status === "Inside"
    ).length;

  document.querySelector("#outsideCount").textContent =
    members.filter(
      m => m.status === "Outside"
    ).length;

  document.querySelector("#resultsLabel").textContent =
    `SHOWING ${shown.length} OF ${members.length} MEMBERS`;

  tbody.innerHTML = shown.map(m => {
    const initials = m.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(x => x[0].toUpperCase())
      .join("");

    const inside = m.status === "Inside";

    return `
      <tr>
        <td>
          <div class="membercell">
            <div class="avatar">
              ${esc(initials)}
            </div>

            <div>
              <div class="mname">
                ${esc(m.name)}
              </div>
              <div class="sub">GYM MEMBER</div>
            </div>
          </div>
        </td>

        <td>
          <span class="idcode">${esc(m.id)}</span>
        </td>

        <td>
          <span class="status ${inside ? "inside" : "outside"}">
            ${esc(m.status.toUpperCase())}
          </span>
        </td>

        <td>
          <span class="last">
            ${esc(m.lastAction)}
          </span>
        </td>

        <td>
          <div class="actions">
            <button
              class="act in"
              data-action="in"
              data-id="${esc(m.id)}"
              ${inside ? "disabled" : ""}
            >
              CHECK IN
            </button>

            <button
              class="act"
              data-action="out"
              data-id="${esc(m.id)}"
              ${!inside ? "disabled" : ""}
            >
              CHECK OUT
            </button>

            <button
              class="act remove"
              data-action="remove"
              data-id="${esc(m.id)}"
              title="Remove member"
            >
              ✕
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  empty.hidden = shown.length > 0;
  tbody.hidden = shown.length === 0;
}

function notify(msg, error = false) {
  clearTimeout(timer);

  toast.textContent = msg;
  toast.classList.toggle("error", error);
  toast.classList.add("show");

  timer = setTimeout(
    () => toast.classList.remove("show"),
    3000
  );
}

form.addEventListener("submit", e => {
  e.preventDefault();

  const id = idInput.value.trim().toUpperCase();
  const name = nameInput.value.trim();

  if (!id || !name) {
    notify(
      "Please enter both a member ID and full name.",
      true
    );

    (!id ? idInput : nameInput).focus();
    return;
  }

  if (!/^[A-Z0-9-]+$/.test(id)) {
    notify(
      "ID can contain only letters, numbers, and hyphens.",
      true
    );

    idInput.focus();
    return;
  }

  if (
    members.some(
      m => m.id.toLowerCase() === id.toLowerCase()
    )
  ) {
    notify(
      "That member ID already exists. Use a unique ID.",
      true
    );

    idInput.focus();
    return;
  }

  members.unshift(new GymMember(id, name));

  save();
  render();
  form.reset();
  idInput.focus();

  notify(`${name} was added to the member list.`);
});

tbody.addEventListener("click", e => {
  const b = e.target.closest("button[data-action]");

  if (!b || b.disabled) return;

  const m = members.find(
    x => x.id === b.dataset.id
  );

  if (!m) return;

  if (b.dataset.action === "remove") {
    if (
      !confirm(
        `Remove ${m.name} (${m.id}) from the member list?`
      )
    ) {
      return;
    }

    members = members.filter(
      x => x.id !== m.id
    );

    save();
    render();

    notify(`${m.name} was removed.`);
    return;
  }

  const result =
    b.dataset.action === "in"
      ? m.checkIn()
      : m.checkOut();

  if (result.success) {
    save();
    render();
    notify(result.message);
  } else {
    notify(result.message, true);
  }
});

search.addEventListener("input", render);
filter.addEventListener("change", render);

document
  .querySelector("#resetDemo")
  .addEventListener("click", () => {
    if (
      !confirm(
        "Reset the list to the original sample members?"
      )
    ) {
      return;
    }

    members = samples.map(
      m => new GymMember(
        m.id,
        m.name,
        m.status,
        m.lastAction
      )
    );

    save();

    search.value = "";
    filter.value = "All";

    render();
    notify("Sample data restored.");
  });

document
  .querySelector("#menu")
  .addEventListener("click", () => {
    document
      .querySelector("#navlinks")
      .classList.toggle("open");
  });

document
  .querySelectorAll("#navlinks a")
  .forEach(a => {
    a.addEventListener("click", () => {
      document
        .querySelector("#navlinks")
        .classList.remove("open");
    });
  });

render();