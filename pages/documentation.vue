<!-- pages/transcripts.vue -->

<template>
    <div class="static-page">
      <article class="prose">
      <h1>Documentation and Data</h1>
        <p>The ArcGIS Online platform “Mapping SS Camps and Ghettos” holds some of the data our research team extracted from the United States Holocaust Memorial Museum’s Encyclopedia of Camps and Ghettos, 1933-1945, vol. 1 (2009) and vol. 2 (2012). The mapping platform enables users to visualize and compare the spatial and temporal patterns of perpetrator sites across the German Reich and much of occupied Europe. Field definitions for data on the platform are available under the "DEFs" button. (A full list of camp and ghetto fields is available <a href="#database-fields">below</a>.) We explain our process of iterative, interdisciplinary database design, data entry, and proofing in this <a href="/media/Knowles & Hillebrand_IJHAC_2020.pdf" target="_blank">journal article</a>, which also explains how we handled the complexity of time in encyclopedia entries. </p>
    <p>The testimony platform contains 979 English-language interview transcripts from the USHMM Oral History Collection. The place terms in each transcript are highlighted, to enable users to study the places of experience embedded in oral histories. Our nine categories of Holocaust places are defined in the <a href="#place-categories">next section</a>. While the categories include geographical place names such as settlements, countries, SS camps, and Jewish ghettos, they also cover thousands of other places where important events happened, places where memories were anchored.</p>

    <h2 id="place-categories">Testimony Search Place Categories</h2>
    <p>For the classification of places mentioned in transcripts of Holocaust survivor testimony.</p>
    <p>The following place categories are intended to support spatial research in Holocaust testimonies, and to link experiences expressed in testimonies to the mapping platform’s data on SS camps and ghettos. They also help us to place events and enable research into the significance of many different kinds of place. We want to consider not only important events but also where they happened, in relation to both mappable and unmappable space – i.e., mapping that requires geographic coordinates or that must be done relationally.</p>
    <p>Generally, our place categories follow the hierarchy commonly used in human and physical geography, moving from larger to smaller places, and from a whole to a part. Thus a region is part of a country or continent, and a distinct landscape feature is part of a region or populated place. The following definitions and examples were developed through close, repeated reading of our first 15 sample testimony transcripts in 2019-2022.</p>

    <h3>Countries, continents, or larger</h3>
    <p>Most often country names will form this category, such as Poland, Canada, Croatia, Egypt. Survivors tend to refer to countries when they describe moving from one to another after liberation, or to describe the whereabouts of their family members. </p>
    <p>There can be cases when it is hard to distinguish a place between this category and Region or Environmental Feature. For example, references to the “Baltic Ocean” or “Western Germany” refer to features larger or smaller than some countries. We have categorized “Baltic Ocean” as Environmental Feature because the root form of the term refers to an ocean. “Western Germany” is categorized as a Region because it is part of the country of Germany. </p>
    <p>Mentions of “earth,” “country,” and “world” also fall under this category. </p>
    <p>Examples:</p>
    <ul>
        <li>“As a family, we began marching towards the city of Krakow, which probably after rethinking, was the wrong place to go, because we should have gone more into the <span class="COUNTRY">country</span>.” (Sol Urbach)</li>
        <li>“...on train and walking and whatever, until we came to <span class="COUNTRY">Austria</span> to Linz.” (Erna Hilfstein)</li>
        <li>“Then my – my father and my brother went – left for Tangier, for North Africa, Tangier in <span class="COUNTRY">Morocco</span>.” (Rena Fagen)</li>
    </ul>
    <h3>Region</h3>
    <p>This category includes mentions of sub-national regions, states or provinces, or islands like Crete or Rhodes.</p>
    <p>This category can be particularly close to Distinct Landscape Feature. As a general rule, we distinguish between them by size or level of generalization. For example, we count references to one side or the other of a geopolitical border, or to a military zone, as a region.</p>
    <p>Examples:</p>
    <ul>
        <li>“We missed the – we made it through the <span class="REGION">Czech</span>, but didn’t quite make it behind the border of the Americans, but they let us in.” (Celina Biniaz)</li>
        <li>“... and I actually got on a mountain, where I climbed the mountain, and over the mountain, I came into <span class="REGION">West</span> <span class="REGION">Germany</span>, where I settled in Bamberg.” (Sol Urbach)</li>
        <li>“... he went through Russia, drafted into the Polish army, through the <span class="REGION">Middle East</span> into Italy, into Montecasino.” (Nathan Offen)</li>
    </ul>
    <h3>Populated places</h3>
    <p>This category includes cities, towns, villages, and hamlets or crossroads settlements. It also includes places called camps or ghettos in testimony, regardless of their size or whether they were located in a pre-existing settlement. In many cases, the name of a populated place is the same as a ghetto, camp, city, and/or district. While a district would be a Region, places are categorized based on their most commonly used context. Mentions of places such as ‘Bonarka’ a specific neighborhood are also part of this category. As in cases when a survivor refers to the ‘ghetto,’ this category also includes unnamed populated places. </p>
    <p>Some camps and ghettos were located in individual buildings. In such cases, if the place referenced is the ‘camp’ or the ‘ghetto’ the place belongs in this category. If instead the survivor refers to the building structure itself, then the category is Building instead.</p>
    <p>Examples:</p>
    <ul>
        <li>“... but we were under guard constantly, going out of the ghetto to work, to <span class="POPULATED_PLACE">Bonarka</span>.” (Nathan Offen)</li>
        <li>“When we had our papers to go to the United States, our passport and visa in <span class="POPULATED_PLACE">Rotterdam</span>, we – we flew to <span class="POPULATED_PLACE">Krakow</span> to her.” (Rena Fagen)</li>
        <li>“And it wasn’t very long journey from <span class="POPULATED_PLACE">Krakow</span> to <span class="POPULATED_PLACE">Auschwitz</span>, to <span class="POPULATED_PLACE">Birkenau</span>.” (Anna Reich)</li>
    </ul>
    <h3>Distinct landscape features</h3>
    <p>This category is made specifically for places that are neither large enough to be described as a geographic or populated region, but too large to be considered a Spatial Object. In this category then, places such as a road, border, street corner, mass grave, garden, the yard of a factory, or appellplatz can be placed. Features a part of distinct buildings, such as mentions of a ‘roof’ or ‘chimney’ are also in this category. </p>
    <p>Particular features within a Populated Place such as ‘Camp D’ within an extermination camp would also be considered a part of this category. In this category, mentions of elements such as ‘air’ are also included. With addresses, streets names like ‘Dietla Street’ would be considered a Distinct Landscape Feature while a specific address with a house number would be a Building. A ‘farm’ belongs in this category while a ‘barn’ would be a Building.</p>
    <p>Examples:</p>
    <ul>
        <li>“... and, at times, on many occasions, we would stand in the gathering plaza in the <span class="DLF">appellplatz</span>, where we would probably be together there every morning or every evening for counting purposes.” (Sol Urbach)</li>
        <li>“... and he was mobbed by the inmates, and he was kissed and thrown into the <span class="DLF">air</span>.” (Moshe Taube)</li>
        <li>“We were standing in the <span class="DLF">courtyard</span>, watching while they walk into our apartment, where my mother was hidden in the closet.” (Lewis Fagen)</li>
    </ul>
    <h3>Buildings</h3>
    <p>This category includes references to one or more physical buildings like a hospital, a school, or a barrack. Institutions such as the ‘Judenrat,’ ‘Red Cross,’ or the ‘bank’ are also included even when a specific structure is not being referenced. Specific schools like ‘Curtis Institute of Music’ or ‘Columbia University,’ and street addresses that include unit or house numbers are also included. Generally places of labor or employment such as a ‘factory’ or ‘workshop’ also belong.</p>
    <p>Examples:</p>
    <ul>
        <li>“... it was a few years, and then 63 where the war – when the war came and found us, right there at <span class="BUILDING">Dietla</span> <span class="BUILDING">63</span>.” (Moshe Taube)</li>
        <li>“... but it had to-- we had to go to the <span class="BUILDING">Red</span> <span class="BUILDING">Cross</span> and register, and register with the <span class="BUILDING">Jewish</span> <span class="BUILDING">agency</span>, and try to find somebody-- so a long process.” (Syda Selinger)</li>
        <li>“... and if I would stay in the <span class="BUILDING">workshop</span>, in the furniture <span class="BUILDING">shop</span>, I could continue living there.” (Sol Urbach)</li>
    </ul>
    <h3>Interior Spaces</h3>
    <p>This category includes references to distinct rooms within a building, for example an office in an administrative building, a kitchen, or an attic. Reference to transportation spaces such as a wagon or trolley belongs under Spatial Object. This category also includes references to large place features of a Building, for example the floor of a factory.</p>
    <p>Examples:</p>
    <ul>
        <li>“...since we had three windows-- one in the <span class="INT_SPACE">kitchen</span> and two in <span class="INT_SPACE">room</span>-- it means that we had to live with nine people together in that one.” (Halina Nelken)</li>
        <li>“... and then we were running to the <span class="INT_SPACE">cellar</span>.” (Lola Orzech)</li>
        <li>“... and he took her from this room to the <span class="INT_SPACE">kitchen</span> and gave us the <span class="INT_SPACE">room</span>.” (Anna Reich)</li>
    </ul>
    <h3>Spatial objects</h3>
    <p>This category includes objects of conveyance such as transportation vehicles of any kind and movable objects such as furniture. References to the actual object type such as ‘furniture’ is also included in this category. While the inclusion of furniture objects is largely an experimental type of places, we recognize that objects can be anchored in memories. In the specific context of survivors mentioning ‘ovens,’ they might be referring to a crematorium but in this case an oven is still an object within a building. </p>
    <p>Examples:</p>
    <ul>
        <li>“They threw out everybody else from the <span class="SPATIAL_OBJ">car</span>, and they gave us the <span class="SPATIAL_OBJ">seats</span>.” (Lewis Fagen)</li>
        <li>“... and I was coming out of the <span class="SPATIAL_OBJ">street</span> <span class="SPATIAL_OBJ">car</span>, and he was supposed to go to a <span class="SPATIAL_OBJ">street</span> <span class="SPATIAL_OBJ">car</span>.” (Lola Orzech)</li>
        <li>“... so because it was happening next to the <span class="SPATIAL_OBJ">desk</span>, I grabbed the scissors, and I sort of cut it off so that my father would still have the feeling that he has a beard.” (Syda Selinger)</li>
    </ul>
    <h3>Environmental features</h3>
    <p>This category refers to any environmental feature both named and unnamed, such as the Adriatic Sea or a general reference to the ‘mountains. As general references both ‘nature’ and ‘water’ are also included in this category. </p>
    <p>Examples:</p>
    <ul>
        <li>“... and they took them on the little <span class="ENV_FEATURES">hill</span> where they were killing.” (Erna Hilfstein)</li>
        <li>“.. and I actually got on a <span class="ENV_FEATURES">mountain</span>, where I climbed the <span class="ENV_FEATURES">mountain</span>, and over the <span class="ENV_FEATURES">mountain</span>, I came into West Germany, where I settled in Bamberg.” (Sol Urbach)</li>
        <li>“... as a matter of fact, we were lying down on the <span class="ENV_FEATURES">ground</span> and hearing the, the, the shells falling, the, the artillery.” (Moshe Taube)</li>
    </ul>
    <h3>Non-physical/imaginary/unspecified</h3>
    <p>In testimonies, survivors will sometimes refer to imagined, non-physical places such as ‘hell’ or ‘heaven,’ or in the forms of metaphors. Naturally, all places mentioned in testimonies are derived from memories and imagined to some extent, but there remains a clear difference between metaphors or imagined places and real, palpable places in the memories of the survivor. This category also includes difficult terms such as ‘inside’ or ‘outside’ or ‘side’ that could be otherwise difficult to pinpoint without context. ‘Community’ is also currently included in this category, as it might be referring to an unspecified consortium of people based on location or identity affiliation.</p>
    <p>Examples:</p>
    <ul>
        <li>“... and they all greeted us with-- they say, from <span class="NPIP">here</span>, is only one way, through the chimney.” (Anna Reich)</li>
        <li>“... so I went through <span class="NPIP">hell</span> till I came over there, but I found him.” (Erna Hilfstein)</li>
        <li>“... we-- we weren't-- it's not like-- it's not like the movies, where now we're free, and everybody just goes off into <span class="NPIP">happy</span> <span class="NPIP">land</span> all of a sudden.” (Leon Leyson)</li>
    </ul>
    <h2 id="data-downloads">Data downloads</h2>
    <p>
      The complete datasets behind the mapping platform can be downloaded here as CSV
      (UTF-8, one row per site, all 194 fields — see the
      <a href="#database-fields">field list below</a> for definitions):
    </p>
    <ul>
      <li><a href="/downloads/ss-camps.csv" download>SS camps dataset</a> — 1,597 camps, subcamps, and death camps (CSV, ~1.8&nbsp;MB)</li>
      <li><a href="/downloads/ghettos.csv" download>Ghettos dataset</a> — 1,295 ghettos in German-occupied Eastern Europe (CSV, ~2.4&nbsp;MB)</li>
    </ul>
    <p>
      The authoritative archival versions of these and related datasets (including
      gazetteers, ghetto region boundaries, and monthly European borders 1938–1945) are
      preserved on the
      <a href="https://geodata.ehri-project.eu/geonetwork/srv/eng/catalog.search#/home" target="_blank" rel="noopener">EHRI Geospatial Repository</a>.
      Filtered query results can also be exported directly from the
      <a href="/map">map</a> (PNG, CSV, GeoJSON) and <a href="/explore">Explore</a> pages.
    </p>

    <h2 id="database-fields">Complete SS camps and ghettos fields</h2>
    <p>Below is a list of 102 fields from the SS camps and ghettos datasets created by the Holocaust Ghettos Project and Placing the Holocaust in 2018-2023. All data was extracted from the United States Holocaust Memorial Museum’s Encyclopedia of Camps and Ghettos, 1933-1945, volumes 1 and 2. This list does not include fields that were made strictly for internal project reference, such as the initials of those who entered or proofed data entry, quotations from the encyclopedia, and notes fields where project members commented on their decisions.</p>
    <p>The fields were created in four different datasets, as indicated by the headings below. The original field names, in parentheses, had to be very short because of the software we were using in these projects. The longer names given here explain the content of each field in more direct language. Fields in bold are included in Placing the Holocaust’s mapping platform, “Mapping SS Camps and Ghettos,” either as fields that can be queried or terms that can be searched for, such as camp or ghetto names.</p>
    <h3>SS Camps</h3>
    <ul>
        <li>Camp name (CampName)</li>
        <li>Camp alias(es) mentioned in the entry (CampAlias)</li>
        <li>Camp system (CampSystem)</li>
        <li>Any main camp or other authority that administered this camp other than the camp system identified above (OtherSys)</li>
        <li>Earliest possible date when camp began operating. This can be when any prisoners (including POWs but excluding free laborers) were held at the site, meaning they slept there (preferred), OR when the entry states the camp was opened or began operation, OR other information on the start date. (StartEarly)</li>
        <li>Latest possible date when camp began operating (StartLate)</li>
        <li>Median start date. Calculated from StartEarly and StartLate. (StartMid)</li>
        <li>Precision of start date. Number of days between earliest and latest possible start date. (StartPrec)</li>
        <li>Certainty of start date (StartCert)</li>
        <li>Type of information used to determine start date (StartType)</li>
        <li>Earliest possible date when camp ceased operating (EndEarly)</li>
        <li>Latest possible date when camp ceased operating (EndLate)</li>
        <li>Median end date. Calculated from EndEarly and EndLate. (EndMid)</li>
        <li>Certainty of end date (EndCert)</li>
        <li>Type of information used to determine end date (EndType)</li>
        <li>Minimum duration of camp (in days) (DurMin)</li>
        <li>Maximum duration of camp (in days) (DurMax)</li>
        <li>Median SS camp duration (in days). Calculated from start and end early and late dates. (DurMid)</li>
        <li>Duration precision. Number of days between DurMin and DurMax. (DurPrec)</li>
        <li>Were some or all prisoners men? (Men)</li>
        <li>Were some or all prisoners women? (Women)</li>
        <li>Were some prisoners elderly? (age 65 or older) (Elderly)</li>
        <li>Were some prisoners youth? (age 15 to 18, inclusive) (Youth)</li>
        <li>Were some prisoners children? (age 0 to 14, inclusive) (Children)</li>
        <li>Nationality of prisoners (Nation)</li>
        <li>Inmate categories (InmateType)</li>
        <li>Maximum stated number of prisoners (PMaxPop)</li>
        <li>Certainty of maximum number of prisoners (PMaxCert)</li>
        <li>Places from which prisoners were sent to the camp (Incomers)</li>
        <li>Places to which prisoners were sent from the camp (Outgoers)</li>
        <li>Places to which prisoners from this camp were removed during final clearance of the camp, OR places to which the dead were taken (RemoveLast)</li>
        <li>Prisoners’ forced labor (LaborType)</li>
        <li>Proximity of work site(s) to prisoner housing (more or less than 0.5km) (WorkProx)</li>
        <li>Labor exploiter(s) who used forced labor (LExName)</li>
        <li>Holding structure(s) where prisoners slept (HoldPStruc)</li>
        <li>Were any existing buildings reused/repurposed to house prisoners? (HPReuse)</li>
        <li>Were any buildings newly constructed to house prisoners? (HPNew)</li>
        <li>Were any holding place buildings below ground? (HPBelowG)</li>
        <li>Was labor done indoors? (LabIndoors)</li>
        <li>Was labor done outdoors?  (LabOutdoors)</li>
        <li>Were buildings newly constructed for work sites? (LBldNew)</li>
        <li>Were existing buildings reused or repurposed for work sites? (LBldReuse)</li>
        <li>Was any labor done below ground? (LabBelowG)</li>
        <li>Epidemic(s) (Epidemic)</li>
    </ul>
    <h3>Ghettos' Basic Attributes</h3>
    <ul>
        <li>Ghetto name (GhettoName)</li>
        <li>Ghetto region (GhettoRegion)</li>
        <li>Earliest possible date of German occupation (GerOcEarly)</li>
        <li>Latest possible date of German occupation (GerOcLate)</li>
        <li>Median date of German occupation. Calculated from GerOcEarly and GerOcLate. (GerOcMid)</li>
        <li>Certainty of German occupation date (GerOcCert)</li>
        <li>Precision of German occupation date. Number of days between GerOcEarly and GerOcLate. (GerOcPrec)</li>
        <li>Other occupiers before German occupation (OtherOcc)</li>
        <li>Judenrat (Judenrat)</li>
        <li>Earliest possible date when ghetto was established, demarcated, or declared (StartEarly)</li>
        <li>Latest possible date when ghetto was established, demarcated, or declared (StartLate)</li>
        <li>Ghetto start date (median). Calculated from StartEarly and StartLate. (StartMid)</li>
        <li>Certainty of start date (StartCert)</li>
        <li>Precision of start date. Number of days between StartEarly and StartLate. (StartPrec)</li>
        <li>Ghetto residents’ forced labor (Labor)</li>
        <li>Were people forced to move into this ghetto? (ForcMovIn)</li>
        <li>Were people forced to move out of this ghetto? (ForcMovOut)</li>
        <li>Did refugees come to this place during the war? (Refugee)</li>
        <li>Number of mass murder events (MM)</li>
        <li>Epidemic(s) (Epidemic)</li>
        <li>Earliest possible date when ghetto ceased to exist (EndEarly)</li>
        <li>Latest possible date when ghetto ceased to exist (EndLate)</li>
        <li>Median end date. Calculated from EndEarly and EndLate. (EndMid)</li>
        <li>Certainty of end date (EndCert)</li>
        <li>Precision of end date. Number of days between EndEarly and EndLate. (EndPrec)</li>
        <li>Minimum duration of ghetto (in days) (DurMin)</li>
        <li>Maximum duration of ghetto (in days) (DurMax)</li>
        <li>Median ghetto duration (in days). Calculated from start and end early and late dates. (DurMid)</li>
        <li>Precision of duration. Number of days between DurMin and DurMax. (DurPrec)</li>
    </ul>
    <h3>Ghettos' Physical Characteristics</h3>
    <ul>
        <li>Jewish population before lasting German occupation (PopJ)</li>
        <li>Certainty Jewish population number before lasting German occupation (PopJCert)</li>
        <li>Year of PopJ source (PopJYear)</li>
        <li>Jewish population upon lasting German occupation (PopJOc)</li>
        <li>Certainty of Jewish population number upon lasting German occupation (PopJOcCert)</li>
        <li>Maximum ghetto population (GPopMax)</li>
        <li>Certainty of maximum ghetto population number (GPopCert)</li>
        <li>Approximate time when first restrictions were imposed, in relation to lasting German occupation (RestrTime)</li>
        <li>All restriction(s) on Jewish life (RestrType)</li>
        <li>Was a death penalty issued? (DeathP)</li>
        <li>Structure(s) or space(s) where Jews were held (HoldPStruc)</li>
        <li>Number of spatially distinct holding places (HoldPNum)</li>
        <li>Type(s) of enclosure that were part of the ghetto (EnclType)</li>
        <li>Ghetto term(s) used in the entry (GType)</li>
    </ul>
    <h3>Mass Removal Events from Ghettos</h3>
    <p>Mass removal defined as the forced removal of 100 or more ghetto residents in a single event. This dataset records mass removals for relocation, forced labor, localized killing, and deportation to a death camp or other camp.</p>
    <p>One field on the platform combines portions of the two fields marked in bold below, to enable mapping of which ghettos sent Jews to which death camps.</p>
    <ul>
        <li>Places from which Jews came to the ghetto (Incomers)</li>
        <li>Number of Jews in a removal event as it began (VicNum)</li>
        <li>Certainty of number of Jews in the removal event (VicNumCert)</li>
        <li>Origin place of the removal event (Origin)</li>
        <li>Certainty that origin was the starting point for event (OriginCert)</li>
        <li>Earliest possible date when the event began (StartEarly)</li>
        <li>Latest possible date when the event began (StartLate)</li>
        <li>Certainty of start date (StartCert)</li>
        <li>Destination of the event (PlaceName)</li>
        <li>Certainty of the destination (PlaceCert)</li>
        <li>Type of destination site (Site)</li>
        <li>Certainty of destination type (SiteCert)</li>
        <li>Mode(s) of transport in the event (Mode)</li>
        <li>Final result of the event (Action)</li>
        <li>Certainty of the final result (ActionCert)</li>
    </ul>
    </article>
    </div>
  </template>
  
  <script>
  export default {
    name: 'DocumentationPage',
    head() {
      return { title: 'Documentation · Placing the Holocaust' };
    }
  }
  </script>
  
  <style scoped>
  .static-page {
    flex: 1;
    min-width: 0;
    padding: 2rem 1.5rem 4rem;
  }

  .prose {
    max-width: 760px;
    margin: 0 auto;
    text-align: left;
    line-height: 1.7;
    color: #222;
  }

  .prose h1 { font-size: 2rem; margin: 0 0 1.25rem; }
  .prose h2 {
    font-size: 1.35rem;
    margin: 2.2rem 0 0.75rem;
    padding-bottom: 0.3rem;
    border-bottom: 1px solid #e5e5e5;
  }
  .prose h3 { font-size: 1.05rem; margin: 1.8rem 0 0.5rem; }
  .prose p { margin: 0 0 1rem; }
  .prose a { color: #000; }
  .prose ul { margin: 0 0 1.25rem; padding-left: 1.4rem; }
  .prose li { margin-bottom: 0.45rem; font-size: 0.95rem; }

  /* Category examples: same quiet underlines as the transcript viewer */
  .prose :deep(span.REGION)          { border-bottom: 2px solid #8fa3b5; }
  .prose :deep(span.COUNTRY)         { border-bottom: 2px solid #7f9370; }
  .prose :deep(span.POPULATED_PLACE) { border-bottom: 2px solid #0aa3d6; }
  .prose :deep(span.ENV_FEATURES)    { border-bottom: 2px solid #0aa93a; }
  .prose :deep(span.DLF)             { border-bottom: 2px solid #d9a800; }
  .prose :deep(span.BUILDING)        { border-bottom: 2px solid #e56f00; }
  .prose :deep(span.INT_SPACE)       { border-bottom: 2px solid #8a63d6; }
  .prose :deep(span.SPATIAL_OBJ)     { border-bottom: 2px solid #c952cc; }
  .prose :deep(span.NPIP)            { border-bottom: 2px solid #d6003e; }
  </style>
  