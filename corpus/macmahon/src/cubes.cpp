// Exhaustive labelled-subset classification. No symmetry reduction is assumed.
// A target is buildable iff its edge graph has at most [target in set] trees.
#include <algorithm>
#include <array>
#include <bit>
#include <chrono>
#include <cstdint>
#include <fstream>
#include <iostream>
#include <numeric>
#include <random>
#include <set>
#include <sstream>
#include <stdexcept>
#include <string>
#include <vector>
#include <omp.h>
#ifdef __BMI2__
#include <immintrin.h>
#endif

using Clock=std::chrono::steady_clock;
uint32_t extract(uint32_t value,uint32_t mask) {
#ifdef __BMI2__
    return _pext_u32(value,mask);
#else
    uint32_t result=0,bit=1;
    while(mask) { uint32_t low=mask&-mask; if(value&low) result|=bit; mask-=low; bit<<=1; }
    return result;
#endif
}
uint32_t deposit(uint32_t value,uint32_t mask) {
#ifdef __BMI2__
    return _pdep_u32(value,mask);
#else
    uint32_t result=0;
    while(mask) { uint32_t low=mask&-mask; if(value&1u) result|=low; mask-=low; value>>=1; }
    return result;
#endif
}
int corner(int x) { return std::min({x,(x%100)*10+x/100,(x%10)*100+x/10}); }
struct Model {
    std::array<std::string,30> names;
    std::array<std::array<int,8>,30> corners;
    std::array<std::array<uint8_t,30>,30> compatible{};
    std::array<uint32_t,30> usable{};
    std::array<std::array<int,20>,30> ids{},edge_a{},edge_b{};
    std::array<std::vector<uint8_t>,30> trees;
    explicit Model(const std::string &path) {
        std::ifstream input(path); if(!input) throw std::runtime_error("Cannot open tableau");
        std::string line; int n=0; std::set<int> all;
        while(std::getline(input,line)) {
            if(line.empty()||line[0]=='#') continue;
            if(n>=30) throw std::runtime_error("Too many cubes");
            std::istringstream row(line); row>>names[n];
            for(int &c:corners[n]) { if(!(row>>c)) throw std::runtime_error("Malformed tableau"); c=corner(c); all.insert(c); }
            std::sort(corners[n].begin(),corners[n].end());
            if(std::adjacent_find(corners[n].begin(),corners[n].end())!=corners[n].end()) throw std::runtime_error("Duplicate corner");
            ++n;
        }
        if(n!=30||all.size()!=40) throw std::runtime_error("Expected 30 cubes and 40 corners");
        for(int t=0;t<30;++t) {
            int edges=0,zero=0;
            for(int c=0;c<30;++c) {
                uint8_t mask=0;
                for(int j=0;j<8;++j) if(std::binary_search(corners[c].begin(),corners[c].end(),corners[t][j])) mask|=uint8_t(1<<j);
                compatible[t][c]=mask;
                int count=std::popcount(mask);
                if(c==t) { if(count!=8) throw std::runtime_error("Target mismatch"); }
                else if(count==0) ++zero;
                else if(count==2) {
                    ids[t][edges]=c; usable[t]|=uint32_t(1)<<c;
                    edge_a[t][edges]=std::countr_zero(unsigned(mask));
                    mask&=mask-1; edge_b[t][edges]=std::countr_zero(unsigned(mask)); ++edges;
                } else throw std::runtime_error("Unexpected usable corner count");
            }
            if(edges!=20||zero!=9) throw std::runtime_error("Unexpected target graph");
        }
    }
    uint8_t tree_count(int t,uint32_t mask) const {
        int parent[8]={0,1,2,3,4,5,6,7},vertices[8]={1,1,1,1,1,1,1,1},edges[8]={};
        while(mask) {
            int e=std::countr_zero(mask); mask&=mask-1;
            int a=edge_a[t][e],b=edge_b[t][e];
            while(parent[a]!=a) a=parent[a];
            while(parent[b]!=b) b=parent[b];
            if(a==b) ++edges[a];
            else {
                if(vertices[a]<vertices[b]) std::swap(a,b);
                parent[b]=a; vertices[a]+=vertices[b]; edges[a]+=edges[b]+1;
            }
        }
        int count=0;
        for(int j=0;j<8;++j) if(parent[j]==j&&edges[j]==vertices[j]-1) ++count;
        return uint8_t(count);
    }
    void prepare(bool matching_tables) {
        #pragma omp parallel for schedule(dynamic)
        for(int t=0;t<30;++t) {
            trees[t].resize(1<<20);
            for(uint32_t mask=0;mask<(1u<<20);++mask) {
                if(!matching_tables) trees[t][mask]=tree_count(t,mask);
                else {
                    uint32_t set=deposit(mask,usable[t]);
                    trees[t][mask]=matching(t,set)?0:matching(t,set|(1u<<t))?1:2;
                }
            }
        }
    }
    bool fast(int t,uint32_t set) const {
        return trees[t][extract(set,usable[t])]<=((set>>t)&1u);
    }
    bool augment(int v,int t,uint32_t available,std::array<int,30>&matched,uint32_t &seen) const {
        uint32_t set=available;
        while(set) {
            int c=std::countr_zero(set); uint32_t bit=1u<<c; set&=set-1;
            if((seen&bit)||!(compatible[t][c]&(1<<v))) continue;
            seen|=bit;
            if(matched[c]<0||augment(matched[c],t,available,matched,seen)) { matched[c]=v; return true; }
        }
        return false;
    }
    bool matching(int t,uint32_t set) const {
        std::array<int,30> matched; matched.fill(-1);
        for(int v=0;v<8;++v) { uint32_t seen=0; if(!augment(v,t,set,matched,seen)) return false; }
        return true;
    }
};

int main(int argc,char **argv) {
    try {
        int k=12,threads=8,prefix_limit=32768; bool histogram=false,selftest=false,matching_tables=false;
        std::string input="results/tableau.txt",output="results/classification.json";
        for(int i=1;i<argc;++i) {
            std::string arg=argv[i];
            if(arg=="--histogram") { histogram=true; continue; }
            if(arg=="--selftest") { selftest=true; continue; }
            if(arg=="--matching-tables") { matching_tables=true; continue; }
            if(arg=="--help") { std::cout<<"cubes --k K --threads N --output FILE [--histogram] [--selftest] [--matching-tables] [--prefix-limit N] [--tableau FILE]\n"; return 0; }
            if(i+1==argc) throw std::runtime_error("Missing argument");
            std::string value=argv[++i];
            if(arg=="--k") k=std::stoi(value); else if(arg=="--threads") threads=std::stoi(value);
            else if(arg=="--output") output=value; else if(arg=="--prefix-limit") prefix_limit=std::stoi(value);
            else if(arg=="--tableau") input=value; else throw std::runtime_error("Unknown argument");
        }
        if(k<0||k>30||threads<1||prefix_limit<1||prefix_limit>32768) throw std::runtime_error("Invalid limits");
        omp_set_num_threads(threads); Model model(input);
        auto start=Clock::now(); model.prepare(matching_tables);
        double preparation=std::chrono::duration<double>(Clock::now()-start).count();
        std::cerr<<"Prepared 30 "<<(matching_tables?"matching":"graph")<<" tables in "<<preparation<<" seconds\n";
        if(selftest) {
            std::mt19937 rng(2024);
            for(int i=0;i<100000;++i) {
                uint32_t set=rng()&((1u<<30)-1); int t=rng()%30;
                if(model.fast(t,set)!=model.matching(t,set)) throw std::runtime_error("Matching/graph disagreement");
            }
            for(uint32_t mask=0;mask<(1u<<20);++mask) {
                uint32_t set=0;
                for(int j=0;j<20;++j) if(mask&(1u<<j)) set|=1u<<model.ids[0][j];
                for(int target=0;target<2;++target) {
                    uint32_t selected=set|uint32_t(target);
                    if(model.fast(0,selected)!=model.matching(0,selected)) throw std::runtime_error("Exhaustive target self-check failed");
                }
            }
            std::cerr<<"PASS: 100000 random comparisons and all 2097152 usable masks for target 0\n";
        }
        std::array<std::vector<uint32_t>,16> low;
        for(uint32_t x=0;x<(1u<<15);++x) low[std::popcount(x)].push_back(x);
        uint64_t checked=0,tests=0; std::array<uint64_t,31> counts{}; std::array<uint64_t,30> rejected{};
        std::array<uint32_t,31> examples; examples.fill(UINT32_MAX);
        std::vector<uint32_t> universal;
        start=Clock::now();
        #pragma omp parallel
        {
            uint64_t local_checked=0,local_tests=0; std::array<uint64_t,31> local_counts{};
            std::array<uint64_t,30> local_rejected{}; std::vector<uint32_t> local_universal;
            std::array<uint32_t,31> local_examples; local_examples.fill(UINT32_MAX);
            #pragma omp for schedule(dynamic,16)
            for(int hi=0;hi<prefix_limit;++hi) {
                int needed=k-std::popcount(unsigned(hi)); if(needed<0||needed>15) continue;
                for(uint32_t lo:low[needed]) {
                    uint32_t set=(uint32_t(hi)<<15)|lo; ++local_checked; int built=0;
                    for(int t=0;t<30;++t) {
                        ++local_tests;
                        if(model.fast(t,set)) ++built;
                        else if(!histogram) { ++local_rejected[t]; break; }
                    }
                    if(histogram) { ++local_counts[built]; local_examples[built]=std::min(local_examples[built],set); }
                    if(built==30) local_universal.push_back(set);
                }
            }
            #pragma omp critical
            {
                checked+=local_checked; tests+=local_tests;
                for(int i=0;i<31;++i) { counts[i]+=local_counts[i]; examples[i]=std::min(examples[i],local_examples[i]); }
                for(int i=0;i<30;++i) rejected[i]+=local_rejected[i];
                universal.insert(universal.end(),local_universal.begin(),local_universal.end());
            }
        }
        double seconds=std::chrono::duration<double>(Clock::now()-start).count();
        std::sort(universal.begin(),universal.end());
        std::ofstream out(output); if(!out) throw std::runtime_error("Cannot open output");
        out<<"{\n\"method\":\""<<(matching_tables?"bipartite matching":"graph tree components")<<"\",\"k\":"<<k<<",\"complete\":"<<(prefix_limit==32768?"true":"false")<<",\"prefix_limit\":"<<prefix_limit
           <<",\"checked\":"<<checked<<",\"target_tests\":"<<tests<<",\"threads\":"<<threads
           <<",\"preparation_seconds\":"<<preparation<<",\"search_seconds\":"<<seconds<<",\"names\":[";
        for(int i=0;i<30;++i) out<<(i?",":"")<<'"'<<model.names[i]<<'"';
        out<<"],\"universal_masks\":[";
        for(size_t i=0;i<universal.size();++i) out<<(i?",":"")<<universal[i];
        out<<"],\"histogram\":";
        if(histogram) { out<<'['; for(int i=0;i<31;++i) out<<(i?",":"")<<counts[i]; out<<']'; } else out<<"null";
        out<<",\"example_masks\":[";
        for(int i=0;i<31;++i) { if(i) out<<','; if(examples[i]==UINT32_MAX) out<<"null"; else out<<examples[i]; }
        out<<"],\"first_rejected_target_counts\":[";
        for(int i=0;i<30;++i) out<<(i?",":"")<<rejected[i];
        out<<"]\n}\n";
        std::cerr<<"checked="<<checked<<" universal="<<universal.size()<<" target_tests="<<tests<<" seconds="<<seconds<<"\n";
        return 0;
    } catch(const std::exception &e) { std::cerr<<e.what()<<'\n'; return 1; }
}
