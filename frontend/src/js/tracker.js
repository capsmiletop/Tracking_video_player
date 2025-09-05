  document.addEventListener("DOMContentLoaded", async () => {
    let table;
    const token = localStorage.getItem("authToken");
    if (!token) {
      // No token → send back to login
      window.location.href = "./login.html";
      return;
    }
    // Verify token with server
    const res = await fetch("https://www.phucandjoeouroneday.com/api/verify-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await res.json();
    if (!data.valid) {
      // Invalid token → clear and redirect
      localStorage.removeItem("authToken");
      window.location.href = "./login.html";
    }
    // Format seconds into mm:ss
    function formatViewTime(seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}m ${secs}s`;
    }

    // Format ISO date into yyyy-mm-dd hh:mm AM/PM
    function formatDate(isoString) {
      console.log("isoString", isoString)
      const date = new Date(isoString);
      console.log('date', date)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      let hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12 || 12; // convert 0 to 12

      return `${year}-${month}-${day} ${hours}:${minutes} ${ampm}`;
    }

    async function loadData() {
      try {
        const response = await fetch("http://localhost:5000/api/getAllData");
        const data = await response.json();

        // Insert rows
        const tbody = document.querySelector("#viewtimesTable tbody");
        tbody.innerHTML = "";
        data.forEach(row => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${row.id}</td>
            <td>${row.country}</td>
            <td>${row.ip}</td>
            <td>${row.city}</td>
            <td>${row.region}</td>
            <td>${row.timezone}</td>
            <td>${row.videoname || "-"}</td>
            <td>${formatViewTime(row.viewtime)}</td>
            <td>${formatDate(row.updatedtime)}</td>
          `;
          tbody.appendChild(tr);
        });

        // Initialize DataTable
        if ($.fn.DataTable.isDataTable("#viewtimesTable")) {
          table.destroy();
        }
        table = $('#viewtimesTable').DataTable({
          pageLength: 5,
          lengthMenu: [5, 10, 20, 50],
        });

        // Custom Filters
        $('#filterCountry').on('keyup', function () {
          table.column(1).search(this.value).draw();
        });
        $('#filterIP').on('keyup', function () {
          table.column(2).search(this.value).draw();
        });
        $('#filterVideo').on('keyup', function () {
          table.column(6).search(this.value).draw();
        });

      } catch (err) {
        console.error("Error loading data:", err);
      }
    }

    loadData();
});
