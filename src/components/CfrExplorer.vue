<script>
export default {
  name: 'CfrExplorer',

  data() {
    return {
      //
      isLoading: false,
      isLoadingCorrections: false,
      onlyShowCorrections: false,
      sortByCorrections: false,
      agencies: [],
      selectedAgencies: [],
      cfrData: [],
      agencyLetter: '',
      alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      titleCache: [],
    };
  },
  methods: {
    getCfrData() {
      // Fetch the CFR data from the API
      const url = 'agencies.json';
      this.fetchData('admin', '1', url, {})
        .then(response => response.json())
        .then(data => {
          this.cfrData = data;
          this.agencies = this.cfrData.agencies.sort((a, b) => a.sortable_name.localeCompare(b.sortable_name));
          this.getCorrectionsCountPerAgency();
        })
        .catch(error => {
          console.error('Error fetching agency data:', error);
        })
        .finally(() => {
          this.isLoading = false;
        });
    },
    async getCorrectionsCountPerAgency() {
      this.isLoadingCorrections = true;
      // Get the corrections count for each agency. To do this, we need to iterate through all the children, if any, of each agency.
      // Use a for loop because we need to await the response
      for (let i = 0; i < this.agencies.length; i++) {
        const agency = this.agencies[i];
        let totalCorrections = await this.countCorrectionsForAgency(agency);
        let totalChildrenCorrections = 0;
        // There aren't any children of children, so we can just get the corrections for each child.
        if (agency.children.length > 0) {
          for (let j = 0; j < agency.children.length; j++) {
            const child = agency.children[j];
            const childCorrections = await this.countCorrectionsForAgency(child);
            if (childCorrections > 0) {
              child.correctionsCnt = childCorrections;
              child.totalCorrectionsCnt = childCorrections;
            }
            // Add the child's corrections to the parent's total
            totalChildrenCorrections += childCorrections;
          }
        }
        agency.correctionsCnt = totalCorrections;
        agency.childrenCorrectionsCnt = totalChildrenCorrections;
        agency.totalCorrectionsCnt = totalCorrections + totalChildrenCorrections;
      }
      this.isLoadingCorrections = false;
    },
    async countCorrectionsForAgency(agency) {
      let agencyCorrections = 0;
      // We need a for loop here because we need to await the response
      for (let i = 0; i < agency.cfr_references.length; i++) {
        const item = agency.cfr_references[i];
        const numTitle = Number(item.title);
        // Arrays need a number so we convert the title to a number
        if (!this.titleCache[numTitle]) {
          try {
            const url = `corrections/title/${item.title}.json`;
            const res = await this.fetchData('admin', '1', url, {});
            const response = await res.json();
            // Stuff it in the cache
            this.titleCache[numTitle] = response;
          } catch (error) {
            console.error('Error fetching corrections data:', error);
          }
        }
        // Now get the data out of the cache
        const data = this.titleCache[numTitle];
        let localCorrections = 0;
        data.ecfr_corrections.forEach(correction => {
          // This is incomplete because not all corrections have a chapter
          // But there is no way to get the chapter from the data in the correction
          if (correction.cfr_references.hierachy?.chapter === item.chapter) {
            localCorrections += 1;
            if (agency.corrections) {
              agency.corrections.push(correction);
            } else {
              agency.corrections = [correction];
            }
          }
        });
        agencyCorrections += localCorrections;
      }
      return agencyCorrections;
    },
    filteredAgenciesCount(letter) {
      const filtered = this.agencies.filter(agency => agency.name.startsWith(letter));
      return filtered.reduce((acc, agency) => acc + agency.children.length + 1, 0);
    },
    pluralize(count, singular, plural) {
      if (plural === undefined) {
        plural = `${singular}s`;
      }
      return count === 1 ? singular : plural;
    },
    fetchData(type, version, url, params) {
      const CfrServer = `https://www.ecfr.gov/api/${type}/v${version}/`;
      const fullUrl = `${CfrServer}${url}`;
      return fetch(fullUrl, {
        method: 'GET',
        mode: 'cors',
        headers: {
          Accept: 'text/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
          'Content-Type': 'application/json',
        },
        ...params,
      });
    },
  },
  computed: {
    agencyCount() {
      return this.agencies.reduce((acc, agency) => acc + agency.children.length + 1, 0);
    },
    filteredAgencies() {
      const sorted = this.sortByCorrections ? this.sortedByCorrections : this.agencies;
      if (!this.agencyLetter) {
        return sorted.filter(agency =>
          this.onlyShowCorrections ? agency.totalCorrectionsCnt : true
        );
      }
      return sorted.filter(
        agency =>
          agency.name.startsWith(this.agencyLetter) &&
          (this.onlyShowCorrections ? agency.totalCorrectionsCnt : true)
      );
    },
    sortedByCorrections() {
      return this.agencies
        .toSorted((a, b) => a.totalCorrectionsCnt - b.totalCorrectionsCnt)
        .reverse();
    },
  },
  created() {
    // Get the CFR data when the component is created
    this.isLoading = true;
    this.getCfrData();
  },
};
</script>
<template>
  <v-container>
    <h1 class="display-2 font-weight-bold mt-1 text-center mb-3">eCFR Explorer</h1>
    <v-divider class="my-2"></v-divider>
    <v-row>
      <v-col>
        <h2 class="text-center">{{ agencyCount }} Federal Agencies &#128561;</h2>
        <div v-if="isLoading" class="text-center">
          <v-progress-circular indeterminate size="16" color="blue" width="2" class="mr-1"></v-progress-circular>
          Loading agency data...
        </div>
        <div v-else-if="agencies.length === 0" class="text-center">
          <p>No agencies found.</p>
        </div>
        <div v-else-if="isLoadingCorrections" class="text-center">
          <v-progress-circular indeterminate size="16" color="blue" width="2" class="mr-1"></v-progress-circular>
          Loading corrections data...
        </div>
      </v-col>
    </v-row>
    <v-row>
      <v-col align-self="end">
        <v-switch
          v-model="onlyShowCorrections"
          @click="sortByCorrections = false"
          label="Only show agencies with corrections"
          persistent-hint
          hint="This includes the corrections of the subagencies."
        ></v-switch>
      </v-col>
      <v-col align-self="end">
        <v-switch
          :disabled="!onlyShowCorrections"
          v-model="sortByCorrections"
          label="Sort agencies by correction count"
          persistent-hint
          hint="The number of corrections includes the corrections of the subagencies."
        ></v-switch>
      </v-col>
    </v-row>
    <v-row>
      <v-col v-for="(letter, index) in alphabet" :key="index">
        <v-tooltip top>
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              v-bind="attrs"
              v-on="on"
              :disabled="!filteredAgenciesCount(letter)"
              x-small
              text
              :outlined="letter === agencyLetter"
              color="blue"
              @click="agencyLetter = letter"
            >
              {{ letter }}
            </v-btn>
          </template>
          <span>
            {{ filteredAgenciesCount(letter) }} {{ pluralize(filteredAgenciesCount(letter), 'agency', 'agencies') }}
          </span>
        </v-tooltip>
      </v-col>
      <v-col>
        <v-btn :outlined="'' === agencyLetter" x-small text color="blue" @click="agencyLetter = ''">All</v-btn>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <v-treeview
          v-model="selectedAgencies"
          :items="filteredAgencies"
          item-text="name"
          item-key="slug"
          label="Agency tree"
          return-object
        >
          <template v-slot:prepend="{ item, open }">
            <v-icon v-if="item.children && item.children.length" @click="open ? $emit('close') : $emit('open')">
              {{ open ? 'mdi-folder-open' : 'mdi-folder' }}
            </v-icon>
            <span v-else>&#127970;</span>
          </template>
          <template v-slot:label="{ item }">
            {{ item.sortable_name }}
            <span v-if="item.children && item.children.length" class="text-caption">
              ({{ item.children.length }} {{ pluralize(item.children.length, 'subagency', 'subagencies') }})
            </span>
            <div class="text-caption" v-if="item.childrenCorrectionsCnt">
              The subagencies have {{ item.childrenCorrectionsCnt }}
              {{ pluralize(item.childrenCorrectionsCnt, 'correction', 'corrections') }}.
            </div>
            <div v-if="!isLoadingCorrections && item.correctionsCnt" class="text-caption">
              <details>
                <summary>
                  This agency has {{ item.correctionsCnt }}
                  {{ pluralize(item.correctionsCnt, 'correction', 'corrections') }}.
                </summary>
                <ul>
                  <li v-for="correction in item.corrections" :key="correction.id">
                    <em>"{{ correction.corrective_action }}"</em>
                    happend on {{ correction.error_corrected }}. Error occurred on {{ correction.error_occurred }}.
                  </li>
                </ul>
              </details>
            </div>
          </template>
        </v-treeview>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped scss></style>
