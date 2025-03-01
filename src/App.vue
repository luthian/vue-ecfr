<template>
  <v-app>
    <v-main>
      <CfrExplorer/>
    </v-main>
  </v-app>
</template>

<script>
import CfrExplorer from '@/components/CfrExplorer';

export default {
  name: 'App',

  components: {
    CfrExplorer,
  },

  data: () => ({
    //
  }),
};
</script>
