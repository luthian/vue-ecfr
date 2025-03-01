<script>
export default {
  name: 'CfrExplorer',

  data() {
    return {
      //
      isLoading: false,
      agencies: [],
      selectedAgencies: [],
      cfrData: [],
      correctionsCountPerAgency: [],
      agencyLetter: '',
      alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    };
  },
  methods: {
    getCfrData() {
      // Fetch the CFR data from the API
      const CfrServer = 'https://www.ecfr.gov/api/admin/v1/';
      const url = `${CfrServer}agencies.json`;
      this.fetchData(url, {})
        .then(response => response.json())
        .then(data => {
          this.cfrData = data;
          this.agencies = this.cfrData.agencies.sort((a, b) => a.display_name.localeCompare(b.display_name));
          this.selectedAgencyIndex = 0;
          // this.getCorrectionsCountPerAgency();
        })
        .catch(error => {
          console.error('Error fetching agency data:', error);
        })
        .finally(() => {
          this.isLoading = false;
        });
    },
    getCorrectionsCountPerAgency() {
      // Get the corrections count for each agency. To do this, we need to iterate through all the children, if any, of each agency.
      // There aren't any children of children, so we can just get the word count of each part.
      this.correctionsCountPerAgency = this.agencies.map(agency => {
        agency.cfr_references.forEach(item => {
          const url = `${agency.url}corrections/title/${item.title}.json`;
          this.fetchData(url, {})
            .then(response => response.json())
            .then(data => {
              const wordCount = data.parts.reduce((acc, part) => acc + part.word_count, 0);
              return {
                agency: agency.display_name,
                count: wordCount,
              };
            })
            .finally(() => {
              this.isLoading = false;
            });
        });
      });
    },
    filteredAgenciesCount(letter) {
      const filtered = this.agencies.filter(agency => agency.display_name.startsWith(letter));
      return filtered.reduce((acc, agency) => acc + agency.children.length + 1, 0);
    },
    pluralize(count, singular, plural) {
      if (plural === undefined) {
        plural = `${singular}s`;
      }
      return count === 1 ? singular : plural;
    },
    fetchData(url, params) {
      return fetch(url, {
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
      return this.filteredAgencies.reduce((acc, agency) => acc + agency.children.length + 1, 0);
    },
    filteredAgencies() {
      if (!this.agencyLetter) {
        return this.agencies;
      }
      return this.agencies.filter(agency => agency.display_name.startsWith(this.agencyLetter));
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
          selectable
          return-object
        />
      </v-col>
      <!-- <v-col>
        <v-btn @click="getCorrectionsCountPerAgency">Get Word Count</v-btn>
      </v-col>
      <v-col>
        <v-list>
          <v-list-item-group>
            <v-list-item v-for="(agency, index) in correctionsCountPerAgency" :key="index">
              <v-list-item-title>{{ agency.agency }}: {{ agency.count }}</v-list-item-title>
            </v-list-item>
          </v-list-item-group>
        </v-list>
      </v-col> -->
    </v-row>
  </v-container>
</template>

<style scoped scss></style>
