var def_count = 1;
allEntries2 = new Array(); 
var conj_count = 0;
allEntries = new Array();  

function defEntry(number,term,notation,statement) 
{
this.number = number;
this.term = term;
this.notation = notation;
this.statement = statement;
}

function conjEntry(number,status,property,statement,leadinvar, relation, i1,i2,i3,i4,i5, reference, comments, notes) 
{
	this.number = number;
	this.status = status;
	this.property = property;
this.statement = statement;
this.leadinvar = leadinvar;   
this.relation = relation;     
this.i1 = i1; 
this.i2 = i2;
this.i3 = i3;
this.i4 = i4;
this.i5 = i5;
this.reference = reference;   
this.comments = comments;     
this.notes = notes;     
}

function initialize()
{

conj_count = 1;
allEntries[conj_count] = new conjEntry(1,"T","C",'L<sub>s</sub>(G) &#8805; n + 1 - 2<font face="Symbol">m</font>(G)',1,">",1,3,2,0,0,'[HL]&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; S. T. Hedetniemi and R. C. Laskar, <i>Connected Domination in graphs</i>, Graph Theory and Combinatorics, 209-218, (1984).<br> [HHS]&nbsp;&nbsp;&nbsp; T.W. Haynes, S. T. Hedetniemi, and P. Slater, Fundamentals of Domination in Graphs, ... <br> 1996, Fajtlowicz proof in the original version of this <a target="_blank" href="http://cms.dt.uh.edu/faculty/delavinae/research/wowII.pdf">list (pdf)</a>'," ","Fajtlowicz 1996"); conj_count = conj_count+1;

allEntries[conj_count] = new conjEntry(2,"O","C",'L<sub>s</sub>(G) &#8805; 2(average of </font><font FACE="Symbol">l</font>(v))',1,">",1,4,0,0,0,'The only conjecture of the original version of this <a target="_blank" href="http://cms.dt.uh.edu/faculty/delavinae/research/wowII.pdf">list (pdf)</a> that remains open'," ","1996"); conj_count = conj_count+1;

allEntries[conj_count] = new conjEntry(3,"O","C",'L<sub>s</sub>(G)&#8805; <font face="Symbol">g</font><sub>i</sub>(G) * maximum temp(v)',1,">",1,7,6,0,0," "," ","1996"); conj_count = conj_count+1;

allEntries[conj_count] = new conjEntry(4,"T","C",'L<sub>s</sub>(G) &#8805; minimum of |N<sub>G</sub>(<span style="text-decoration: overline">e</span>)| - 1',1,">",1,8,20,0,0,'Proven in the orginal version of this <a target="_blank" href="http://cms.dt.uh.edu/faculty/delavinae/research/wowII.pdf">list</a>'," ","DeLaVina 1996"); conj_count = conj_count+1;

allEntries[conj_count] = new conjEntry(5,"T","C",'L<sub>s</sub>(G) &#8805; maximum{| S(v, rad(G)) |: v is a center of G}',1,">",1,9,0,0,0,'Proven in the orginal version of this <a target="_blank" href="http://cms.dt.uh.edu/faculty/delavinae/research/wowII.pdf">list</a>'," ","DeLaVina and Fajtlowicz 1996"); conj_count = conj_count+1;

allEntries[conj_count] = new conjEntry(6,"T","C",'L<sub>s</sub>(G) &#8805; 1 + n -</i></font><i><font face="Symbol">m</font>(G)-<font face="Symbol"> a</font>(G)',1,">",1,3,2,5,0,'Proven in the orginal version of this <a target="_blank" href="http://cms.dt.uh.edu/faculty/delavinae/research/wowII.pdf">list</a>'," ","DeLaVina 1996"); conj_count = conj_count+1;
allEntries[conj_count] = new conjEntry(7,"T","C",' ',1,">",1,4,3,5,0,'[DFW] &nbsp;&nbsp;&nbsp;&nbsp; E. DeLaVina, S. Fajtlowicz and B. Waller,  <a target="_blank" href="http://cms.dt.uh.edu/faculty/delavinae/GPC/griggsngraffiti.pdf">On Conjectures of Griggs and Graffiti</a>, Graphs and Discovery DIMACS: Series in Discrete Mathematics and Theoretical Computer Science, Vol. 69, 2005.'," "," "); conj_count = conj_count+1;


allEntries[conj_count] = new conjEntry(8,"T","C",'L<sub>s</sub>(G) &#8805; maximum of dist<sub>even</sub>(v) -&nbsp; <font face="Symbol">a</font>(G)',1,">",1,10,5,0,0,'Proven in the orginal version of this <a target="_blank" href="http://cms.dt.uh.edu/faculty/delavinae/research/wowII.pdf">list</a>'," ","DeLaVina 1996"); conj_count = conj_count+1;
allEntries[conj_count] = new conjEntry(9,"E","T",'p(T) &#8805; <font face="Symbol">D(T)</font> -1',12,">",12,11,0,0,0,"E. DeLaVina, Graffiti.pc, <I>Graph Theory Notes of New York</I>, (2002), XLII, 26-30"," ","2001"); conj_count = conj_count+1;
allEntries[conj_count] = new conjEntry(10,"E","T",'p(T) &#8805; CEIL(L(T)/2)',12,">",12,17,16,0,0,"E. DeLaVina, Graffiti.pc, <I>Graph Theory Notes of New York</I>, (2002), XLII, 26-30"," ","2001"); conj_count = conj_count+1;
allEntries[conj_count] = new conjEntry(11,"E","T",'p(T) &#8805; 2<font face="Symbol">a</font>(T) - n',12,">",12,5,3,0,0,"E. DeLaVina, Graffiti.pc, <I>Graph Theory Notes of New York</I>, (2002), XLII, 26-30"," ","2001"); conj_count = conj_count+1;
allEntries[conj_count] = new conjEntry(12,"E","T",'2<font face="Symbol">a</font>(T) - n &#8805; maximum of dist<sub>even</sub>(v) - minimum of&nbsp; dist<sub>even</sub>(v)',0,">",5,3,10,0,0,"E. DeLaVina, Graffiti.pc, <I>Graph Theory Notes of New York</I>, (2002), XLII, 26-30"," ","2001"); conj_count = conj_count+1;
allEntries[conj_count] = new conjEntry(13,"O","C",'b(G) &#8805; diam(G) + maximum of <font face="Symbol">l</font>(v) -1',15,">",15,14,4,0,0,'E. DeLaVina and B. Waller, <i>On Some Conjectures of Graffiti.pc On the Maximum Order of Induced Subgraphs</i> <a target="new"  href="http://cms.dt.uh.edu/faculty/delavinae/GPC/maximum_induced_subgraphs.pdf">(pdf)</a>, <I> Congressus Numerantium</I> (2004) Vol. 166, 11-32'," ","July 3, 2003"); conj_count = conj_count+1;
allEntries[conj_count] = new conjEntry(14,"T","C",'b(G) &#8805; diam(G) + f<sub>G</sub>(1) -1',15,">",15,14,18,0,0," "," ","July 3, 2003. DeLaVina and Waller 2003"); conj_count = conj_count+1;
allEntries[conj_count] = new conjEntry(15,"T","C",'b(G) &#8805; 2rad(G)',15,">",15,13,0,0,0," "," ","July 3, 2003. Independently by Fajtlowicz and Waller 2003"); conj_count = conj_count+1;
allEntries[conj_count] = new conjEntry(16,"O","C",'b(G) &#8805; 2(rad(G)-1) + maximum of <font face="Symbol">l</font>(v)',15,">",15,13,4,0,0," "," ","*July 3, 2003."); conj_count = conj_count+1;
allEntries[conj_count] = new conjEntry(17,"O","C",'b(G) &#8805; <font face="Symbol">a</font>(G) + CEIL(diam(G)/3)',15,">",15,5,14,16,0," "," ","July 3, 2003."); conj_count = conj_count+1;
allEntries[conj_count] = new conjEntry(18,"O","C",'b(G) &#8805; <font FACE="Symbol">a</font>(G) + CEIL(sqrt(dist<sub>max</sub>(M)))',15,">",15,5,19,16,0," "," ","July 3, 2003."); conj_count = conj_count+1;
allEntries[conj_count] = new conjEntry(19,"O","C",'b(G) &#8805; FLOOR(average of ecc(v)+maximum of <font face="Symbol">l</font>(v))',15,">",15,21,4,22,0," "," ","July 3, 2003."); conj_count = conj_count+1;
allEntries[conj_count] = new conjEntry(20,"O","C",'b(G) &#8805; n/FLOOR[deg<sub>avg</sub>(G)]',15,">",15,23,22,0,0," "," ","July 3, 2003."); conj_count = conj_count+1;   
allEntries[conj_count] = new conjEntry(21,"F","C",'CEIL(2dist(B,V)))&#8805; CEIL(2dist<sub>avg</sub>(V))',24,">",25,24,16,0,0," "," ",'July 3, 2003. DeLaVina and Waller July 4, 2003; see the <a target="rbottom" href="ceconj21.bmp"> counterexample </a> (created by Waller' + "'s" + ' GraphDraw program)<p> Also note this conjecture was a by-product of dalmatian implemented in Graffiti.pc. See <I>On Some History of the Development of Graffiti </i> <A target = "_blank" href="http://cms.dt.uh.edu/faculty/delavinae/GPC/history.ps">(ps 32MB)</A>  <A href="http://cms.dt.uh.edu/faculty/delavinae/GPC/history.zip">(zipped ps 1MB)</A></I> </p>'); conj_count = conj_count+1;   
allEntries[conj_count] = new conjEntry(22,"O","C",'b(G) &#8805; FLOOR[<font FACE="Symbol">a</font>(G) + dist<sub>avg</sub>(M))]',15,">",15,5,26,22,0," "," ","July 3, 2003."); conj_count = conj_count+1;
allEntries[conj_count] = new conjEntry(23,"O","C",'b(G) &#8805; <font FACE="Symbol">l</font>(G) + CEIL[minimum of dist<sub>even</sub>(v)/3]',15,">",15,4,10,16,0," "," ","July 3, 2003."); conj_count = conj_count+1;
allEntries[conj_count] = new conjEntry(24,"O","C",'b(G) &#8805; 2CEIL[(1 + minimum of dist<sub>even</sub>(v))/3]',15,">",15,10,16,0,0," "," ","July 3, 2003."); conj_count = conj_count+1;
allEntries[conj_count] = new conjEntry(25,"O","C",'b(G) &#8805; CEIL[1 + dd(G)<sup>0.25</sup>]',15,">",15,27,16,0,0," "," ","July 3, 2003."); conj_count = conj_count+1;
allEntries[conj_count] = new conjEntry(26,"O","C",'b(G) &#8805; (minimum of |N(e)|)<sup>t(G)-1</sup>',15,">",15,28,29,20,0," "," ","July 3, 2003."); conj_count = conj_count+1;
allEntries[conj_count] = new conjEntry(27,"O","C",'b(G) &#8805; dist<sub>min</sub>(A)+ (dist<sub>min</sub>(M))<sup>0.25</sup>',15,">",15,30,19,0,0," "," ","July 3, 2003."); conj_count = conj_count+1;
allEntries[conj_count] = new conjEntry(28,"O","C",'b(G) &#8805; dist<sub>max</sub>(A)+ 1/(n mod <font face="Symbol">D</font>(<span style="text-decoration: overline">G</span>))',15,">",15,30,3,31,32," "," ","July 3, 2003. The expression on the right is undefined for some graphs. The conjecture is made for those graphs for which is is defined."); conj_count = conj_count+1;
allEntries[conj_count] = new conjEntry(29,"O","C",'b(G) &#8805; dist<sub>min</sub>(A)+ |E<sub><span style="text-decoration: overline">G</span></sub>(M(<span style="text-decoration: overline">G</span>))|<sup>0.25</sup>',15,">",15,30,31,34,33," "," ","July 3, 2003."); conj_count = conj_count+1;
allEntries[conj_count] = new conjEntry(30,"R","C",'path(G) &#8805; 2rad(G) - 1',35,">",35,21,13,0,0,"Paul Erdos, Michael Saks and Vera Sos, <i>Maximum Induced Trees in Graphs</i>, Journal of Graph Theory, 41(1986), p. 61-79."," ","July 15, 2003. This is Chung's Lemma, see reference."); conj_count = conj_count+1;
allEntries[conj_count] = new conjEntry(31,"O","C",'path(G) &#8805; dist<sub>avg</sub>(A) + 0.5 ecc<sub>avg</sub>(M)',35,">",35,30,21,34,36," "," ","July 15, 2003."); conj_count = conj_count+1;
allEntries[conj_count] = new conjEntry(32,"O","C",'path(G) &#8805; CEIL[2dist<sub>avg</sub>(M,V)]',35,">",35,37,16,0,0," "," ","July 2003."); conj_count = conj_count+1;
allEntries[conj_count] = new conjEntry(33,"O","C",'path(G) &#8805; CEIL[dist<sub>avg</sub>(C,V) + dist<sub>avg</sub>(M,V)]',35,">",35,21,38,37,16," "," ","July 15, 2003."); conj_count = conj_count+1;
allEntries[conj_count] = new conjEntry(34,"R","C",'path(G) &#8805; 1 + diam(G)',35,">",35,21,14,0,0,"Paul Erdos, Michael Saks and Vera Sos, <i>Maximum Induced Trees in Graphs</i>, Journal of Graph Theory, 41(1986), p. 61-79."," ","July 15, 2003. This could also have been labeled an exercise, but since it was noted in the cited reference we include it here as a rediscovery."); conj_count = conj_count+1;
allEntries[conj_count] = new conjEntry(35,"F","C",'path(G) &#8805; 2rad(G)/dp(G)',35,">",35,21,39,0,0," "," ",'July 2003. Waller Oct 19, 2003; see his <a target="rbottom" href="ceconj35.bmp"> counterexample </a> (created by Waller' + "'s" + ' GraphDraw program)'); conj_count = conj_count+1;
allEntries[conj_count] = new conjEntry(36,"O","C",'path(G) &#8805; CEIL[1 + sqrt(n mod <font face="Symbol">D</font>(<span style="text-decoration: overline">G</span>))]',35,">",35,31,32,16,0," "," ","July 15, 2003."); conj_count = conj_count+1;
allEntries[conj_count] = new conjEntry(37,"O","C",' ',35,">",35,31,40,11,16," "," ","July 15, 2003."); conj_count = conj_count+1;
allEntries[conj_count] = new conjEntry(38,"O","C",' ',35,">",35,21,14,0,0,"[F] &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; S. Fajtlowicz, On the Size of Independence Sets in Graphs, <I>Proceedings of the 9th SE conference on Combinatorics, Graph Theory and Computing, Boca Raton </I>, (1978) 269-274 <br> [BB] &nbsp;&nbsp; S. Bau and L.W. Beineke: The decycling numbers of graphs, <i>Australasian Journal of Combinatorics</i>, 25(2002), 285-298.<br> [ZL] &nbsp; &nbsp;M. Zheng and X. Lu, On the Maximum Induced Forests of a Connected Cubic Graph without Triangles, <i>Discrete Math.</i>, 85(1990), 89-96. <br>[BHS]  J.A. Bondy, G. Hopkins and W. Staton, Lower bounds for induced forests in cubic graphs, <i>Canad. Math. Bull. </i> 30(1987), 193-199. <br> [LZ]&nbsp; &nbsp; J-P. Liu and C. Zhao, A new bound on the feedback vertex sets in cubic graphs, <i>Discrete Math. </i>,148(1996), 119-131.  <br>[AMT] N. Alon, D. Mubayi and R. Thomas, Large induced forests in sparse graphs, <i>J. Graph Theory</i>, 38(2001), 113-123. "," ","2001"); conj_count = conj_count+1;
allEntries[conj_count] = new conjEntry(39,"O","C",' ',35,">",35,21,14,0,0,"[F] &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; S. Fajtlowicz, A Characterization of Radius-Critical Graphs, <I>Journal of Graph Theory</I>, (1988) 526-532."," ","1988"); conj_count = conj_count+1;
allEntries[conj_count] = new conjEntry(40,"O","C",' ',35,">",35,21,14,0,0,'[DG] &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; E. DeLaVina and I. Gramajo, Some Elementary lower bounds on the matching number of a bipartite graph, <i>Bulletin of the ICA</i> Vol. 54, pp. 93-102, 2008. (<a target="new" href="http://cms.dt.uh.edu/faculty/delavinae/research/matchingwithGramajo.pdf">preprint</a>) '," ","2008"); conj_count = conj_count+1;
allEntries[conj_count] = new conjEntry(41,"O","C",' ',35,">",35,21,14,0,0,"[W] &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; D.West, Introduction to Graph Theory with Applications"," ","2004"); conj_count = conj_count+1;
allEntries[conj_count] = new conjEntry(42,"O","C",' ',35,">",35,21,14,0,0,"[BT] &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; G. Bacso and Z. Tuza, A characterization of graphs without long induced paths, Journal of Graph Theory 14 (1990), 455-464"," ","1990"); conj_count = conj_count+1;
allEntries[conj_count] = new conjEntry(43,"O","C",' ',15,">",15,14,4,0,0,'[DW] &nbsp;&nbsp;&nbsp;&nbsp; E. DeLaVina and B. Waller, <i>Spanning Trees with Many Leaves and the Average Distance</i> <a target="new"  href="http://cms.dt.uh.edu/faculty/delavinae/research/spantrees_bipartite_subgraphs.pdf"> preprint(pdf)</a>, 2006'," ","2005"); conj_count = conj_count+1;
allEntries[conj_count] = new conjEntry(44,"O","C",' ',15,">",15,14,4,0,0,'[KV] &nbsp;&nbsp;&nbsp;&nbsp; Mekkia Kouider and Preben Dahl Vestergaard, <i>Generalized connected domination in graphs</i>, Discrete Mathematics and Theoretical Computer Science, vol. 8, 2006'," ","2006"); conj_count = conj_count+1;
allEntries[conj_count] = new conjEntry(45,"O","C",' ',15,">",15,14,4,0,0,'[DPW] &nbsp;&nbsp;&nbsp;&nbsp; E. DeLaVina, R. Pepper and B. Waller, <i>Independence, Radius and Hamiltonian Paths</i>, MATCH Commun. Math. Comput. Chem: proceedings of the conference "Computers in Scientific Discovery III", Ghent, February 6-9, 2006 (eds. G. Brinkmann, P. W. Fowler) 58, pp. 481-510 <a target="new"  href="http://cms.uhd.edu/faculty/delavinae/research/indradiushampath.pdf"> preprint(pdf)</a>, 2007'," ","2005"); conj_count = conj_count+1;
allEntries[conj_count] = new conjEntry(46,"O","C",' ',15,">",15,14,4,0,0,'[ALH] &nbsp;&nbsp;&nbsp;&nbsp; R. B. Allan, R. C. Laskar, and S. T. Hedetniemi, <i>A Note on Total Domination</i>, Discrete Math., 49:7-13, 1984'," ","2005"); conj_count = conj_count+1;
allEntries[conj_count] = new conjEntry(47,"O","C",' ',15,">",15,14,4,0,0,'[CDH] &nbsp;&nbsp;&nbsp;&nbsp; E. J. Cocknaye, R. M. Dawnes, and S. T. Hedetniemi, <i>Total Domination in Graphs</i>, Networks, 10:211-219, 1980'," ","2005"); conj_count = conj_count+1;
allEntries[conj_count] = new conjEntry(48,"O","C",' ',15,">",15,14,4,0,0,'[KW] &nbsp;&nbsp;&nbsp;&nbsp; D. J. Kleitman and D. B. West, <i>Spanning Trees with Many Leaves</i>, SIAM J. Discrete Math, 4:99-106, 1991'," ","2005"); conj_count = conj_count+1;
allEntries[conj_count] = new conjEntry(49,"O","C",' ',15,">",15,14,4,0,0,'[DLPWW] &nbsp;&nbsp;&nbsp;&nbsp; E. DeLaVina, Q. Liu, R. Pepper, B. Waller and D. B. West, <i>On some conjectures of Graffiti.pc on total domination, </i> <a target="new"  href="http://cms.dt.uh.edu/faculty/delavinae/research/total_dom_2007.pdf"> preprint(pdf)</a>, 2007'," ","2007"); conj_count = conj_count+1;
allEntries[conj_count] = new conjEntry(50,"O","C",' ',35,">",35,21,14,0,0,"[W] &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; D. R. Woodall, More elementary lower bounds on the matching number of a bipartite graph, preprint 2008"," ","2008"); conj_count = conj_count+1;

allEntries[conj_count] = new conjEntry(51,"O","C",' ',15,">",15,14,4,0,0,'[DPW] &nbsp;&nbsp;&nbsp;&nbsp; E. DeLaVina, R. Pepper and B. Waller, <i>Lower bounds for the domination number</i> <a target="new" href="http://cms.dt.uh.edu/faculty/delavinae/research/dom-lower-bounds-April17.PDF"> preprint(pdf)</a>, 2008'," ","2008"); conj_count = conj_count+1;

allEntries[conj_count] = new conjEntry(52, "O", "C", ' ', 15, ">", 15, 14, 4, 0, 0, '[CH] &nbsp;&nbsp;&nbsp;&nbsp; M. Chellali and T. Haynes, <i>Total and paired-domination numbers of a tree</i>, AKCE Int. J. Graphs Comb. 1, 2004', " ", "2004"); conj_count = conj_count + 1;
allEntries[conj_count] = new conjEntry(53, "O", "C", ' ', 15, ">", 15, 14, 4, 0, 0, '[DH] &nbsp;&nbsp;&nbsp;&nbsp; W. J. Desormeaux and M. A. Henning, <i>Lower bounds onthe total domination number of a graph</i>, J Comb Optim 31, 2016', " ", "2016"); conj_count = conj_count + 1;
allEntries[conj_count] = new conjEntry(54, "O", "C", ' ', 15, ">", 15, 14, 4, 0, 0, '[M] &nbsp;&nbsp;&nbsp;&nbsp; P. Mufuta, <i>Leaf number and Hamiltonian C_4-free graphs</i>, Afrika Matematika 28:1067-1074, 2017', " ", "2017"); conj_count = conj_count + 1;
}


function printConjTableEntry(i,color)
{

      if (color == 1)
      { 
        parent.rtop.document.write('<table border="0" bgcolor="#EBEBEB" cellpadding="0" cellspacing="0" style="border-collapse:collapse" bordercolor="#111111" width="100%" id="AutoNumber2" height="39"><tr><td valign="top" width="4%" height="35">');
      }
      else
      {  
       parent.rtop.document.write('<table border="0" bgcolor="#FFFFFF" cellpadding="0" cellspacing="0" style="border-collapse: collapse" bordercolor="#111111" width="100%" id="AutoNumber2" height="39"><tr><td valign="top" width="4%" height="35">');
      }
      parent.rtop.document.write(allEntries[i].status);    
      parent.rtop.document.write('</td><td valign="top" width="4%" height="35"><b>');
      parent.rtop.document.write(allEntries[i].number);
      parent.rtop.document.write('.&nbsp;</b></td><td width="60%" height="35">');
      parent.rtop.document.write('<i><font face="Times New Roman">');
      if (allEntries[i].property == "C")
      {
	      parent.rtop.document.write("If G is a simple connect graph, then ");
      }
      else 
      {	      parent.rtop.document.write("If T is a tree, then ");
	  }
		
parent.rtop.document.write("</font>");
parent.rtop.document.write(allEntries[i].statement);
parent.rtop.document.write("</i>");
      parent.rtop.document.write('</td><td width="30%" height="35"><font FACE="Arial" SIZE="2"><a  class="white" href="javascript:printDefinitions(');
      parent.rtop.document.write(allEntries[i].i1);
      parent.rtop.document.write(",");
      parent.rtop.document.write(allEntries[i].i2);
      parent.rtop.document.write(",");
      parent.rtop.document.write(allEntries[i].i3);
      parent.rtop.document.write(",");
      parent.rtop.document.write(allEntries[i].i4);
      parent.rtop.document.write(",");
      parent.rtop.document.write(allEntries[i].i5);
      parent.rtop.document.write(')">definitions</a>');
      if (allEntries[i].reference != " ")
      {
      parent.rtop.document.write('&nbsp; <a  class="white" href="javascript:printConjRef(');
      parent.rtop.document.write(i);      
      parent.rtop.document.write(')">reference</a>');      
      }
      parent.rtop.document.write('</font></td></tr><tr><td width="4%" height="35">&nbsp;</td><td width="3%" height="35">&nbsp;</td><td width="60%" height="35">');
      parent.rtop.document.write(allEntries[i].notes);
      parent.rtop.document.write('</td><td width="30%" height="35">&nbsp;</td></tr><tr><td width="4%" height="35">&nbsp;</td><td width="3%" height="35">&nbsp;</td><td width="60%" height="35">&nbsp;</td><td width="30%" height="35">&nbsp;</td></tr></table>');

}

function printConjRef(i)
   {
       initialize();
	 parent.rbottom.document.write(allEntries[i].reference);      
	 parent.rbottom.document.close();

   }


function printConjList()
{
var color = 0;
initialize();
parent.rtop.document.write('<html><head><meta http-equiv="Content-Type" content="text/html; charset=windows-1252">');
parent.rtop.document.write("<s");
parent.rtop.document.write("cript ");
parent.rtop.document.write("type=");
parent.rtop.document.write('"text/javas');
parent.rtop.document.write('cript" ');
parent.rtop.document.write(" src=");
parent.rtop.document.write('"wowIIdefs.');
parent.rtop.document.write('js"> ');
parent.rtop.document.write("</");
parent.rtop.document.write("scr"+"ipt>");
parent.rtop.document.write('</head><body>');

parent.rtop.document.write('<style type="text/css">');
parent.rtop.document.write("<!--");
parent.rtop.document.write("a:link {color: #0000ff; text-decoration: none}a:visited {color: #800080; text-decoration:none} a:hover {color: ff0000; text-decoration: underline} a:link.white {color: blue; text-decoration: none} a:visited.white {color: blue; text-decoration:none} a:hover.white {color: red; text-decoration: underline}");

parent.rtop.document.write("-->");
parent.rtop.document.write("</style>");
  for (var count = 1; count < 36; count++)
  {
      printConjTableEntry(count,color);
      if (color == 0)
      { color = 1;}
      else color = 0;
  }
  parent.rtop.document.write('</body>');
  parent.rtop.document.write('</html>');
  parent.rtop.document.close();
}

function printOpenConjList()
{
var color = 0;
parent.rtop.document.write('<html><head><meta http-equiv="Content-Type" content="text/html; charset=windows-1252"></head><body>');
parent.rtop.document.write("<s");
parent.rtop.document.write("cript ");
parent.rtop.document.write("type=");
parent.rtop.document.write('"text/javas');
parent.rtop.document.write('cript" ');
parent.rtop.document.write(" src=");
parent.rtop.document.write('"wowIIdefs.');
parent.rtop.document.write('js"> ');
parent.rtop.document.write("</");
parent.rtop.document.write("scr"+"ipt>");
parent.rtop.document.write('<style type="text/css">');
parent.rtop.document.write("<!--");
parent.rtop.document.write("a:link {color: #0000ff; text-decoration: none}a:visited {color: #800080; text-decoration:none} a:hover {color: ff0000; text-decoration: underline} a:link.white {color: blue; text-decoration: none} a:visited.white {color: blue; text-decoration:none} a:hover.white {color: red; text-decoration: underline}");

parent.rtop.document.write("-->");
parent.rtop.document.write("</style>");
  for (var count = 1; count < 36; count++)
  {
       if (allEntries[count].status == "O")
          {
	          printConjTableEntry(count,color);
      if (color == 0)
      { color = 1;}
      else color = 0;
          }
      
  }
  parent.rtop.document.write('</body>');
  parent.rtop.document.write('</html>');
  parent.rtop.document.close();
}



function printExerConjList()
{
var color = 0;
parent.rtop.document.write('<html><head><meta http-equiv="Content-Type" content="text/html; charset=windows-1252">');
parent.rtop.document.write("<s");
parent.rtop.document.write("cript ");
parent.rtop.document.write("type=");
parent.rtop.document.write('"text/javas');
parent.rtop.document.write('cript" ');
parent.rtop.document.write(" src=");
parent.rtop.document.write('"wowIIdefs.');
parent.rtop.document.write('js"> ');
parent.rtop.document.write("</");
parent.rtop.document.write("scr"+"ipt>");
parent.rtop.document.write('</head><body>');
parent.rtop.document.write('<style type="text/css">');
parent.rtop.document.write("<!--");
parent.rtop.document.write("a:link {color: #0000ff; text-decoration: none}a:visited {color: #800080; text-decoration:none} a:hover {color: ff0000; text-decoration: underline} a:link.white {color: blue; text-decoration: none} a:visited.white {color: blue; text-decoration:none} a:hover.white {color: red; text-decoration: underline}");

parent.rtop.document.write("-->");
parent.rtop.document.write("</style>");
  for (var count = 1; count < 36; count++)
  {
       if (allEntries[count].status == "E")
          {
	          printConjTableEntry(count,color);
      if (color == 0)
      { color = 1;}
      else color = 0;
          }
      
  }
  parent.rtop.document.write('</body>');
  parent.rtop.document.write('</html>');
  parent.rtop.document.close();
}

function printResolvedConjList()
{
parent.rtop.document.write('<html><head><meta http-equiv="Content-Type" content="text/html; charset=windows-1252">');
parent.rtop.document.write("<s");
parent.rtop.document.write("cript ");
parent.rtop.document.write("type=");
parent.rtop.document.write('"text/javas');
parent.rtop.document.write('cript" ');
parent.rtop.document.write(" src=");
parent.rtop.document.write('"wowIIdefs.');
parent.rtop.document.write('js"> ');
parent.rtop.document.write("</");
parent.rtop.document.write("scr"+"ipt>");
parent.rtop.document.write('</head><body>');
parent.rtop.document.write('<style type="text/css">');
parent.rtop.document.write("<!--");
parent.rtop.document.write("a:link {color: #0000ff; text-decoration: none}a:visited {color: #800080; text-decoration:none} a:hover {color: ff0000; text-decoration: underline} a:link.white {color: blue; text-decoration: none} a:visited.white {color: blue; text-decoration:none} a:hover.white {color: red; text-decoration: underline}");

parent.rtop.document.write("-->");
parent.rtop.document.write("</style>");
var color = 0;
  for (var count = 1; count < 36; count++)
  {
       if ((allEntries[count].status == "T") || (allEntries[count].status == "F") || (allEntries[count].status == "R"))
          {
	          printConjTableEntry(count,color);
      if (color == 0)
      { color = 1;}
      else color = 0;
          }
      
  }
  parent.rtop.document.write('</body>');
  parent.rtop.document.write('</html>');
  parent.rtop.document.close();
}

function printRediscoveryConjList()
{
var color = 0;
parent.rtop.document.write('<html><head><meta http-equiv="Content-Type" content="text/html; charset=windows-1252">');
parent.rtop.document.write("<s");
parent.rtop.document.write("cript ");
parent.rtop.document.write("type=");
parent.rtop.document.write('"text/javas');
parent.rtop.document.write('cript" ');
parent.rtop.document.write(" src=");
parent.rtop.document.write('"wowIIdefs.');
parent.rtop.document.write('js"> ');
parent.rtop.document.write("</");
parent.rtop.document.write("scr"+"ipt>");
parent.rtop.document.write('</head><body>');
parent.rtop.document.write('<style type="text/css">');
parent.rtop.document.write("<!--");
parent.rtop.document.write("a:link {color: #0000ff; text-decoration: none}a:visited {color: #800080; text-decoration:none} a:hover {color: ff0000; text-decoration: underline} a:link.white {color: blue; text-decoration: none} a:visited.white {color: blue; text-decoration:none} a:hover.white {color: red; text-decoration: underline}");

parent.rtop.document.write("-->");
parent.rtop.document.write("</style>");

  for (var count = 1; count < 36; count++)
  {
       if (allEntries[count].status == "R") 
          {
	          printConjTableEntry(count,color);
      if (color == 0)
      { color = 1;}
      else color = 0;
          }
      
  }
  parent.rtop.document.write('</body>');
  parent.rtop.document.write('</html>');
  parent.rtop.document.close();
}

function initialize2()
{
def_count = 1;
allEntries2[def_count] = new defEntry(1,"maximum number of leaves of a spanning tree","L<sub>s</sub>(G)","A <i>spanning tree</i> of a graph is a subgraph that contains all the vertices and is a tree. Note that a graph may have many spanning trees. The <i>maximum number of leaves of a spanning tree</i> is maximum number of vertices of degree one (in the spanning tree) over all spanning trees of the graph."); def_count = def_count+1;
allEntries2[def_count] = new defEntry(2,"matching number",'<font face="Symbol">m</font>(G)',"The maximum number of edges such that no two have a vertex in common."); def_count = def_count+1;
allEntries2[def_count] = new defEntry(3,"number of vertices","n","The number of vertices of the graph."); def_count = def_count+1;
allEntries2[def_count] = new defEntry(4,"local independence of a vertex",'<font face="Symbol">l</font>(v)','The independence number of the subgraph induced by the neighbors of vertex v. The <i>maximum of <font face="Symbol">l</font>(v)</i> , also denoted <i><font face="Symbol">l</font><sub>max</sub>(v)</i>, is the largest among all local independence of the vertices of the graph; the smallest of all local independence of vertices is denoted <i><font face="Symbol">l</font><sub>min</sub>(v)</i>. The <i>average of <font face="Symbol">l</font>(v)</i>, <i><font face="Symbol">l</font><sub>avg</sub>(v)</i>,  is the average of all local independence of the vertices of the graph. <i>Note:</i> if <i>maximum of <font face="Symbol">l</font>(v)</i> &#8804; 2, then the graph is claw-free'); def_count = def_count+1;
allEntries2[def_count] = new defEntry(5,"independence number of a graph",'<font face="Symbol">a</font>(G)',"The maximum number of vertices such that no two are adjacent ."); def_count = def_count+1;
allEntries2[def_count] = new defEntry(6,"temperature of a vertex",'temp(v)',"deg(v)/(n(G)-deg(v)). The <i>maximum of temp(v)</i> is the maximum of all temp(v) for v a vertex of G."); def_count = def_count+1;
allEntries2[def_count] = new defEntry(7,"independent domination number",'<font face="Symbol">g</font><sub>i</sub>(G) or i(G)',"A subset of the vertices, D, of the graph is called a <i>dominating set</i> of the graph if for every vertex v of the graph, either in v is D or there exists an edge (u,v) with u in D. A dominating set of a graph G is said to be independent if no two vertices are adjacent. The <i>independent domination number of a graph</i> is the size of a smallest independent dominating set of the graph."); def_count = def_count+1;
allEntries2[def_count] = new defEntry(8,"neighborhood of a nonedge of G",'N<sub>G</sub>(<span style="text-decoration: overline">e</span>)','Let <span style="text-decoration: overline">e</span>=(u,v) such that u and v are not adjacent in the graph, G. The <i>neighborhood of <span style="text-decoration: overline">e</span></i> is the set of vertices adjacent (in G) to at least one of u or v.'); def_count = def_count+1;
allEntries2[def_count] = new defEntry(9,"surface of a sphere","S(v,k)","Let v be a vertex of G. The set of all vertices whose distance from v is k is S(v,k)."); def_count = def_count+1;
allEntries2[def_count] = new defEntry(10,"even distance from a vertex v","dist<sub>even</sub>(v)","The number of vertices whose distance from v is an even integer. The <i>minimum of dist<sub>even</sub>(v)</i> is the smallest among all <i>dist<sub>even</sub>(v)</i> for v a vertex of the graph. The <i>maximum of dist<sub>even</sub>(v)</i> is the largest among all <i>dist<sub>even</sub>(v)</i> for v a vertex of the graph. The <i>average of dist<sub>even</sub>(v)</i> is the average of all dist<sub>even</sub>(v) for v a vertex of the graph"); def_count = def_count+1;
allEntries2[def_count] = new defEntry(11,"maximum degree of a graph",'<font face="Symbol">D</font>(G)',"The degree of a vertex is the number of edges incident to the vertex. The <i>maximum degree of the graph</i> is the maximum of all degrees of the vertices of the graph"); def_count = def_count+1;
allEntries2[def_count] = new defEntry(12,"path covering number",'p(G)',"The minimum number of vertex disjoint paths needed to cover the vertices of the graph."); def_count = def_count+1;
allEntries2[def_count] = new defEntry(13,"radius of the graph","rad(G)","The minimum of eccentricities of vertices of the graph."); def_count = def_count+1;
allEntries2[def_count] = new defEntry(14,"diameter of a graph","diam(G)","The maximum of eccentricities of vertices of the graph."); def_count = def_count+1;
allEntries2[def_count] = new defEntry(15,"bipartite number of a graph","b(G)","The maximum number of vertices of an induced bipartite subgraph of the graph."); def_count = def_count+1;
allEntries2[def_count] = new defEntry(16,"ceiling of a number, x",'CEIL[x]',"The smallest integer greater than or equal to x."); def_count = def_count+1;
allEntries2[def_count] = new defEntry(17,"number of leaves of a tree, T","L(T)","The number of vertices of degree one of the tree. Also called <i>the number of pendant vertices</i>"); def_count = def_count+1;
allEntries2[def_count] = new defEntry(18,"frequency of degree one","f<sub>1</sub>(G)","The number of vertices of degree one of the graph. Also known as the number of pendant vertices. Note, if the graph is a tree, then this is equivalent to the number of leaves of the tree"); def_count = def_count+1;
allEntries2[def_count] = new defEntry(19,"distance between maximum degree vertices","dist<sub>?</sub>(M)","Let M be the set of vertices of maximum degree of the graph. Then dist<sub>max</sub>(M) = maximum{dist<sub>G</sub>(u,v) | u and v are in M} and dist<sub>min</sub>(M) = minimum{dist<sub>G</sub>(u,v) | u and v are in M}."); def_count = def_count+1;
allEntries2[def_count] = new defEntry(20,"cardinality of a set, S",'|S|',"The number of elements of the set."); def_count = def_count+1;
allEntries2[def_count] = new defEntry(21,"eccentricity of a vertex","ecc(v)","The eccentricity of a vertex, v, is the maximum of {dist<sub>G</sub>(v,u)| u is a vertex of the graph}."); def_count = def_count+1;
allEntries2[def_count] = new defEntry(22,"floor of a number, x",'FLOOR[x]',"The largest integer less than or equal to x."); def_count = def_count+1;
allEntries2[def_count] = new defEntry(23,"average degree of a graph",'deg<sub>avg</sub>(G)',"The average of the degrees of all vertices of the graph."); def_count = def_count+1;
allEntries2[def_count] = new defEntry(24,"average distance of graph","dist<sub>avg</sub>(V)","average of all dist<sub>G</sub>(u,v) such that u and v are distinct vertices of the graph."); def_count = def_count+1;
allEntries2[def_count] = new defEntry(25,"average distance from periphery vertices (previously called here boundary vertices)","dist<sub>avg</sub>(B,V)","Let B be the set of vertices of maximum eccentricity. The average of all dist<sub>G</sub>(b,v)>0 such that b is in B and v is in V."); def_count = def_count+1;
allEntries2[def_count] = new defEntry(26,"average distance between maximum degree vertices","dist<sub>avg</sub>(M)","Let M be the set of vertices of maximum degree of the graph. Then dist<sub>avg</sub> is the average of all nonzero dist<sub>G</sub>(u,v) such that u and v are in M."); def_count = def_count+1;
allEntries2[def_count] = new defEntry(27,"number of distinct degrees",'dd(G)',"The number of distinct values of the degree sequence of the graph"); def_count = def_count+1;
allEntries2[def_count] = new defEntry(28,"neighborhood of an edge",'N(e)','Let e=(u,v) such that u and v are adjacent in the graph. The <i>neighborhood of e</i> is the set of vertices of V adjacent to at least one of u or v.'); def_count = def_count+1;
allEntries2[def_count] = new defEntry(29,"number of triangles of a graph",'t(G)',"The number of subgraphs isomorphic to a complete graph on 3 vertices of the graph"); def_count = def_count+1;
allEntries2[def_count] = new defEntry(30,"distance between minimum degree vertices","dist<sub>?</sub>(A)","Let A be the set of vertices of minimum degree of the graph. Then dist<sub>max</sub>(A) = maximum{dist<sub>G</sub>(u,v) | u and v are in A} and dist<sub>min</sub>(A) = minimum{dist<sub>G</sub>(u,v) | u and v are in A}. dist<sub>avg</sub>(A) is the average of all nonzero dist<sub>G</sub>(u,v) such that u and v are in A"); def_count = def_count+1;
allEntries2[def_count] = new defEntry(31,"the complement of a graph, G",'<span style="text-decoration: overline">G</span>','Let G be a graph. The complement graph of G, denoted <span style="text-decoration: overline">G</span>, is the graph on the same vertex set such that u and v are adjacent in <span style="text-decoration: overline">G</span> if and only if they are not adjacent in G.'); def_count = def_count+1;
allEntries2[def_count] = new defEntry(32,"n modulus maximum degree",'n mod <font face="Symbol">D</font>(G)','For <font face="Symbol">D</font>(G) &#8805; 2, n mod <font face="Symbol">D</font>(G) is the remainder upon division of n (number of vertices of G) by <font face="Symbol">D</font>(G).'); def_count = def_count+1;
allEntries2[def_count] = new defEntry(33,"subset of edges of G induced by a subset of vertices, S",'E<sub>G</sub>(S)','For S a subset of the vertices. The subset of edges of G induced by vertices of S is the set of (u,v) such that u and v are in S and are adjacent in G.'); def_count = def_count+1;
allEntries2[def_count] = new defEntry(34,"set of vertices of maximum degree of the graph G",'M(G)','note we may use M if there is no confusion which graph is under discussion'); def_count = def_count+1;
allEntries2[def_count] = new defEntry(35,"path number of a graph","path(G)","The number of vertices of a largest induced path of the graph."); def_count = def_count+1;
allEntries2[def_count] = new defEntry(36,"average eccentricty of a set of vertices, S","ecc<sub>avg</sub>(S)","Let S be a subset of the vertices a graph. Then ecc<sub>avg</sub>(S) is the average of all ecc(v) such that v is in S. In case S = V(G) the number is denoted as <i>ecc<sub>avg</sub>(G)</i> "); def_count = def_count+1;
allEntries2[def_count] = new defEntry(37,"average distance from maximum degree vertices","dist<sub>avg</sub>(M,V)","Let M be the set of vertices of maximum degree of the graph with vertex set V. Then dist<sub>avg</sub>(M,V) is the average of all nonzero dist<sub>G</sub>(u,v) such that u is in M and and v is in V."); def_count = def_count+1;
allEntries2[def_count] = new defEntry(38,"average distance from center vertices","dist<sub>avg</sub>(C,V)","Let C be the set of vertices of minimum eccentricity of the graph. Then dist<sub>avg</sub>(C,V) is the average of all nonzero dist<sub>G</sub>(u,v) such that u is in C and and v is in V."); def_count = def_count+1;
allEntries2[def_count] = new defEntry(39,"number of diametrical pairs of a graph",'dp(G)',"The number of pairs of vertices of a graph, G, which are at distance diam(G)"); def_count = def_count+1;
allEntries2[def_count] = new defEntry(40,"sum of degrees of a graph",'<font face="Symbol">&#229;</font>deg<sub>G</sub>(v)',"The sum of all degrees of the graph G."); def_count = def_count+1;
allEntries2[def_count] = new defEntry(41,"forest number of a graph","f(G)","The number of vertices of a largest induced forest of the graph."); def_count = def_count+1;
allEntries2[def_count] = new defEntry(42,"residue of a graph","res(G)","Order the degree sequence in nondecreasing order d<sub>1</sub> &ge; d<sub>2</sub> &ge; ... &ge; d<sub>n-1</sub> &ge; d<sub>n</sub>, remove d<sub>1</sub> and subtract one from each of the next d<sub>1</sub> entries of the ordered sequence. Now with the resulting sequence order again and repeat that is remove the largest entry and subtract one of the subsequent values of the sequence. Continue until the sequence is a zero sequence. The residue is the number of zeros at the end of this process."); def_count = def_count+1;
allEntries2[def_count] = new defEntry(43,"girth of a graph","girth(G)","the number of vertices of a smallest cycle of the graph."); def_count = def_count+1;
allEntries2[def_count] = new defEntry(44,"length of a graph","length(G)","the square root of the sum of the squares of degrees."); def_count = def_count+1;
allEntries2[def_count] = new defEntry(45,"mode of degrees of a graph","mode(G)","the mode of the degree sequence is the most frequently occuring degree. In case there is more than one mode, <i><b>mode<sub>min</sub></b></i> is the smallest mode and <i><b>mode<sub>max</sub></b></i> the largest mode. In case there is more than one mode, dd<sub>mode</sub>(G) is the number of <b>distinct modes</b>."); def_count = def_count+1;
allEntries2[def_count] = new defEntry(46,"neighborhood of a subset of the vertices, S","N(S)","is the set of vertices that are adjacent to at least one vertex of S. "); def_count = def_count+1;
allEntries2[def_count] = new defEntry(47,"progressive join of two graphs G and H","progressive-join(G,H)","take the union of G and H. Enumerate the vertices of G as 0,1,...,n(G)-1. Enumerate the vertices of H as 0,1,...,n(H)-1. Then for every vertex i of G join it to vertices j of H such that i => j. This operation is not well defined in the sense that it depends on enumeration."); def_count = def_count+1;
allEntries2[def_count] = new defEntry(48,"tree number of a graph","tree(G)","The number of vertices of a largest induced tree of the graph."); def_count = def_count+1;
allEntries2[def_count] = new defEntry(49,"domination number",'<font face="Symbol">g</font>(G) or domination(G)',"A subset of the vertices, D, of the graph is called a <i>dominating set</i> of the graph if for every vertex v of the graph, either in v is D or there exists an edge (u,v) with u in D. The <i>domination number of a graph</i> is the size of a smallest dominating set of the graph."); def_count = def_count+1;
allEntries2[def_count] = new defEntry(50,"mode of even degrees of a graph","even_mode(G)","the mode of the even degrees of the degree sequence is the most frequently occuring degree that is an even integer. In case there is more than one mode, <i><b>even_mode<sub>min</sub></b></i> is the smallest and <i><b>even_mode<sub>max</sub></b></i> the largest."); def_count = def_count+1;
allEntries2[def_count] = new defEntry(51,"Number of triangles incident to a vertex","T(v)","the number of triangles incident to a vertex v, is the number of distinct complete subgraphs on three vertices that include vertex <i>v</i>. Compute T(v) for each vertex and we end up with a sequence of length <i>n</i>. <i><b>T<sub>min</sub>(v)</b></i> is the smallest value of the sequence and <i><b>T<sub>max</sub>(v)</b></i> the largest. <i><b>freq[T<sub>max</sub>(v)]</b></i> is the frequency of the value T<sub>max</sub>(v)"); def_count = def_count+1;
allEntries2[def_count] = new defEntry(52,"eccentricty of a set of vertices, S","ecc(S)","Let S be a subset of the vertices a graph. By the <i>distance from a vertex</i>, v, to a set we mean the smallest distance from v to any of the vertices of S. Then ecc(S) is the maximum of distances from vertices of V-S to the set S."); def_count = def_count+1;
allEntries2[def_count] = new defEntry(53,"n modulus 2",'n mod 2','The number <i>n mod 2</i> is the remainder upon division of n (number of vertices of G) by 2.'); def_count = def_count+1;
allEntries2[def_count] = new defEntry(54,"closed neighborhood of a subset of the vertices, S","N[S]","is the (set) union of N(S) and S. "); def_count = def_count+1;
allEntries2[def_count] = new defEntry(55,"the periphery of G (previously called here set of boundary vertices)","B","The periphery of G is the set of vertices of maximum eccentricity of the graph."); def_count = def_count+1;
allEntries2[def_count] = new defEntry(56,"minimum degree of a graph",'<font face="Symbol">d</font>(G)',"The degree of a vertex is the number of edges incident to the vertex. The <i>minimum degree of the graph</i> is the minimum of all degrees of the vertices of the graph"); def_count = def_count+1;
allEntries2[def_count] = new defEntry(57,"clique number of a graph",'<font face="Symbol">w</font>(G)',"The maximum number of vertices such that every two are adjacent ."); def_count = def_count+1;
allEntries2[def_count] = new defEntry(58,"induced circumference of a graph","circumference(G)","the number of vertices of a largest induced cycle of the graph."); def_count = def_count+1;
allEntries2[def_count] = new defEntry(59,"LN","LN(x)","the natural logarithm of x."); def_count = def_count+1;
allEntries2[def_count] = new defEntry(60,"alphacore of a graph",'<font face="Symbol">a</font><sub>c</sub>(G)',"The cardinality of the intersection of all maximum independent sets of G."); def_count = def_count+1;
allEntries2[def_count] = new defEntry(61,"average distance between center vertices","dist<sub>avg</sub>(C)","Let C be the set of vertices of minimum eccentricity of the graph. Then dist<sub>avg</sub> is the average of all nonzero dist<sub>G</sub>(u,v) such that u and v are in C."); def_count = def_count+1;
allEntries2[def_count] = new defEntry(62,"frequency of degree k","freq(degree k)","The number of occurances of degree k among the vertices of the graph."); def_count = def_count+1;
allEntries2[def_count] = new defEntry(63,"Let S be a subset of the vertices of G",'<font face="Symbol">d</font>(G)'," = min{deg_G(v): v in S}"); def_count = def_count+1;
allEntries2[def_count] = new defEntry(64," ",'','A <b>center vertex </b> is a vertex of minimum eccentricity. The center of the graph is the set of all vertices that are centers.'); def_count = def_count+1;
allEntries2[def_count] = new defEntry(65,"second smallest degree of the degree sequence ",'<font face="Symbol">s</font>(G)',"order the degree sequence in nondecreasing order d<sub>1</sub> &#8804; d<sub>2</sub> &#8804; ... &#8804; d<sub>n-1</sub> &#8804; d<sub>n</sub>, the second smallest degree of the sequence is the 2nd entry."); def_count = def_count+1;
allEntries2[def_count] = new defEntry(66,"Set Difference ",'A-B',"The set of elements in A but not in B."); def_count = def_count+1;
allEntries2[def_count] = new defEntry(67,"Edge Set ",'E(G)',"The set of edges of G."); def_count = def_count+1;
allEntries2[def_count] = new defEntry(68,"median of the degree sequence (lower and upper)",' ','Let d<sub>1</sub> &#8804; d<sub>2</sub> &#8804; ... &#8804; d<sub>n-1</sub> &#8804; d<sub>n</sub> be the degree sequence in nondecreasing order. If the graph has an odd number of vertices, then median of the ordered degree sequence is the d<sub>(n+1)/2+1</sub> degree; otherwise it is the average of the degrees d<sub>n/2</sub> and  d<sub>n/2+1</sub>. If the graph has an odd number of vertices then the <b>lower</b> and <b>upper</b> median are precisely the median degree of the graph; if the number of vertices is even, then the <b>lower median</b> is the <i>d<sub>n/2</sub></i> degree and the <b>upper median</b> is the <i>d<sub>(n+2)/2</sub></i> degree. '); def_count = def_count+1;
allEntries2[def_count] = new defEntry(69,"minimum degree among vertices of a subset, of vertices, S ",'<font face="Symbol">d</font>(S)',"minimum {deg<sub>G</sub>(v) | v in S}"); def_count = def_count+1;
allEntries2[def_count] = new defEntry(70,"maximum degree among vertices of a subset of vertices, S ",'<font face="Symbol">D</font>(S)',"maximum {deg<sub>G</sub>(v) | v in S}"); def_count = def_count+1;
allEntries2[def_count] = new defEntry(71,"ordered degree sequence ",'d<sub>1</sub> &#8804; d<sub>2</sub> &#8804; ... &#8804; d<sub>n-1</sub> &#8804; d<sub>n</sub>','the degree sequence ordered in nondecreasing order.'); def_count = def_count+1;
allEntries2[def_count] = new defEntry(72,"second largest degree of the degree sequence ",'<font face="Symbol">S</font>(G)',"order the degree sequence in nondecreasing order d<sub>1</sub> &#8804; d<sub>2</sub> &#8804; ... &#8804; d<sub>n-1</sub> &#8804; d<sub>n</sub>, the second largest degree of the sequence is the (n-1)th entry."); def_count = def_count+1;
allEntries2[def_count] = new defEntry(73,"C<sub>4</sub>-free characteristic function ",'<font face="Symbol">c</font><sub>C4</sub>(G)'," is 1 if G is C<sub>4</sub>-free (not necessarily induced) and 0 otherwise."); def_count = def_count+1;
allEntries2[def_count] = new defEntry(74,"unique maximum independent set characteristic function ",'u(G)'," is 1 if G is has a unique independent set and 0 otherwise."); def_count = def_count+1;
allEntries2[def_count] = new defEntry(75,"Second power graph of G",'G<sup>2</sup>'," is the graph on the same vertex as G with two vertices adjacent if and only if their distance in G is 2 or less."); def_count = def_count+1;
allEntries2[def_count] = new defEntry(76,"maximum degree of vertices on radial circles",'<font face="Symbol">D</font>(R)'," is the maximum of degrees of vertices on radial circles. A radial circle is the set of vertices at distance radius from a center vertex."); def_count = def_count+1;
allEntries2[def_count] = new defEntry(77,"tree characteristic function ",'t(G)'," is 1 if G is a tree and 0 otherwise."); def_count = def_count+1;
allEntries2[def_count] = new defEntry(78,"K<sub>3</sub>-free characteristic function ",'<font face="Symbol">c</font><sub>K3</sub>(G)'," is 1 if G is K<sub>3</sub>-free (i.e. triangle-free) and 0 otherwise."); def_count = def_count+1;
allEntries2[def_count] = new defEntry(79,"total distance of a vertex ",'Tdist<sub>?</sub>(v)'," is the sum of distances from v to all other vertices. Tdist<sub>min</sub>(v) is the minimum total distance among all vertices. Tdist<sub>max</sub>(v) is the maximum of total distance among all vertices."); def_count = def_count+1;
allEntries2[def_count] = new defEntry(80,"Edges induced by a vertex set ",'E(S)'," is the set of edges induced by the vertices of S."); def_count = def_count+1;
allEntries2[def_count] = new defEntry(81,"a radial circle centered at a center vertex v",'R(v)'," is the of vertices at distance radius from vertex v."); def_count = def_count+1;
allEntries2[def_count] = new defEntry(82,"Claw-free characteristic function ",'<font face="Symbol">c</font><sub> claw </sub>'," is 1 if G is Claw-free, i.e. if it is K(1,3) free, and 0 otherwise."); def_count = def_count+1;
allEntries2[def_count] = new defEntry(83,"average distance between boundary vertices","dist<sub>avg</sub>(B)","Let B be the set of vertices of maximum eccentricity of the graph. Then dist<sub>avg</sub> is the average of all nonzero dist<sub>G</sub>(u,v) such that u and v are in B."); def_count = def_count+1;
allEntries2[def_count] = new defEntry(84,"bipartite characteristic function ",'<font face="Symbol">c</font><font face="Times New Roman"><sub>bipartite</sub>(G)'," is 1 if G is a bipartite graph and 0 otherwise."); def_count = def_count+1;
allEntries2[def_count] = new defEntry(85,"Hamiltonian path",' ',"A graph is said to have a Hamiltonian path if there exist two vertices with a path between them which visits each vertex of the graph exactly once."); def_count = def_count+1;
allEntries2[def_count] = new defEntry(86,"Chromatic number",'&#967;(G)',"the fewest number of colors needed to color the vertices of the graph in such a way that adjacent vertices receive different colors."); def_count = def_count+1;
allEntries2[def_count] = new defEntry(87,"regular graph characteristic function ",'<font face="Symbol">c</font><sub>regular</sub>(G)'," is 1 if G is regular, that is if maximum and minimum degrees are the same and 0 otherwise."); def_count = def_count+1;
allEntries2[def_count] = new defEntry(88,"connectivity number",' &#954;(G)'," is the fewest number of vertices whose removal disconnects the graph."); def_count = def_count+1;

allEntries2[def_count] = new defEntry(89,"annihilation number",'A(G)','is defined as follows: let d<sub>1</sub>,d<sub>2</sub>, . . . ,d<sub>n</sub> be the degree sequence of a graph G arranged in non-decreasing order. A(G) is the largest integer k such that the sum of the first k terms of the sequence is at most half the sum of the entire sequence (i.e. the size of G).'); def_count = def_count+1;

allEntries2[def_count] = new defEntry(90,"2-domination number",'<font face="Symbol">g<sub>2</sub></font>',"A subset of the vertices, D<sub>2</sub>, of the graph is called a <i>2-dominating set</i> of the graph if for every vertex v of the graph, either in v is D<sub>2</sub> or v is adjacent to 2 vertices of D<sub>2</sub>. The <i>2-domination number of a graph</i> is the size of a smallest 2-dominating set of the graph."); def_count = def_count+1;

allEntries2[def_count] = new defEntry(91,"number of 2-distance diametrical pairs of a graph",'2-B(G)',"The number of pairs of vertices of the boundary of a graph, which are at distance two"); def_count = def_count+1;
allEntries2[def_count] = new defEntry(92,"residue = 2 characteristic function ",'<font face="Symbol">c</font><sub>residue=2</sub>(G)'," is 1 if the residue of G is equal to 2, otherwise the value is 0."); def_count = def_count+1;
allEntries2[def_count] = new defEntry(93,"even horizontal of a vertex ",'even horizontal(v)'," is the number of edges whose endpoints are at the same even distance from vertex v."); def_count = def_count+1;
allEntries2[def_count] = new defEntry(94," total domination number",'<font face="Symbol">g<sub>t</sub></font>',"A subset of the vertices, D<sub>t</sub>, of the graph is called a <i> total dominating set</i> of the graph if for every vertex v of the graph is adjacent to a vertex of D<sub>t</sub>. The <i>total domination number of a graph</i> is the size of a smallest total dominating set of the graph."); def_count = def_count+1;
allEntries2[def_count] = new defEntry(95,"average distance from each vertex of a set of vertices","dist<sub>avg</sub>(S,V)","Let S be a subset of vertices. The average of all dist<sub>G</sub>(s,v)>0 such that s is in S and v is in V."); def_count = def_count+1;
allEntries2[def_count] = new defEntry(96,"1st quartile of the degree sequence",' ','Let d<sub>1</sub> &#8804; d<sub>2</sub> &#8804; ... &#8804; d<sub>n-1</sub> &#8804; d<sub>n</sub> be the degree sequence in nondecreasing order. The <b>1st quartile</b> is the <i>d<sub>(n)/4</sub></i> degree. '); def_count = def_count+1;
allEntries2[def_count] = new defEntry(97,"edges horizontal to a vertex ",'horizontal(v)'," is the number of edges whose endpoints are at the same distance from vertex v."); def_count = def_count+1;
allEntries2[def_count] = new defEntry(98,"average degree of vertices of a subset of vertices, S ",'deg_{avg}(S)'," is the average of deg<sub>G</sub>(v) for v in S"); def_count = def_count+1;
allEntries2[def_count] = new defEntry(99,"G well total dominated",' '," is a graph in which every minimal total dominating set is a minimum total dominating set"); def_count = def_count+1;
allEntries2[def_count] = new defEntry(100,"Subgraph induced by S",'&lt;S&gt; or G[S]'," is a graph with vertex set S and edged set E(S) = {(u,v): u and v in S and u is adjacent to v in G}"); def_count = def_count+1;
allEntries2[def_count] = new defEntry(101,"odd distance from a vertex v","dist<sub>odd</sub>(v)","The number of vertices whose distance from v is an odd integer. The <i>minimum of dist<sub>odd</sub>(v)</i> is the smallest among all <i>dist<sub>odd</sub>(v)</i> for v a vertex of the graph. The <i>maximum of dist<sub>odd</sub>(v)</i> is the largest among all <i>dist<sub>odd</sub>(v)</i> for v a vertex of the graph. The <i>average of dist<sub>odd</sub>(v)</i> is the average of all dist<sub>odd</sub>(v) for v a vertex of the graph"); def_count = def_count+1;
allEntries2[def_count] = new defEntry(102,"odd horizontal of a vertex ",'odd horizontal(v)'," is the number of edges whose endpoints are at the same odd distance from vertex v."); def_count = def_count+1;

allEntries2[def_count] = new defEntry(103,"average eccentricty of G ",'ecc<sub>avg</sub>(G)'," is average of eccentricities of vertices of G."); def_count = def_count+1;

allEntries2[def_count] = new defEntry(104,"vertex cover number of G ",'v<sub>c</sub>(G)'," is number of vertices of a smallest subset S of the vertices of the graph such that each edge of the graph has at least one endpoint in S."); def_count = def_count+1;
allEntries2[def_count] = new defEntry(105,"critical independence number of G ",'<font face="Symbol">a</font>\'(G)',' is number of vertices of a largest critical independent set. A <b> critical independent set </b> S is a subset of the vertices of the graph that is independent and has the property that |S| - |N(S)| </font>&#8805;<font face="Times New Roman"> |U| - |N(U)| for any independent subset U of the vertices of G.'); def_count = def_count+1;
allEntries2[def_count] = new defEntry(106,"number of cut vertices of G ",'&kappa;<sub>v</sub>(G)','; a cut vertex is whose removal from the graph increases the number of components of the graph.'); def_count = def_count+1;
allEntries2[def_count] = new defEntry(107,"A support vertex of G ",' ',' is a vertex that is adjacent to a leaf of G. A <b>leaf</b> of G is a vertex of degree 1'); def_count = def_count+1;

allEntries2[def_count] = new defEntry(108,"average of eccentricities of vertices in S",'ecc<sub>avg</sub>(S)'," is average of eccentricities of vertices in S."); def_count = def_count+1;

allEntries2[def_count] = new defEntry(109,"average distance from a set","dist<sub>avg</sub>(S)","Let S be a subset of vertices. The average of all dist<sub>G</sub>(S,v)>0 where v is in V. The dist<sub>G</sub>(S,v)> is the miminimum of dist(s,v) where s is in S."); def_count = def_count+1;

allEntries2[def_count] = new defEntry(110,"kth step for a zero in the Havil-Hakimi process","","Order the degree sequence in non-increasing order d<sub>1</sub> &ge; d<sub>2</sub> &ge; ... &ge; d<sub>n-1</sub> &ge; d<sub>n</sub>, remove d<sub>1</sub> and subtract one from each of the next d<sub>1</sub> entries of the ordered sequence. Now with the resulting sequence order again, and repeat that is remove the largest entry and subtract one of the subsequent values of the sequence. Continue until a zero occurs in a resulting sequence. kth step for a zero in the Havil-Hakimi process is the number of iterations until a zero occurs."); def_count = def_count+1;

allEntries2[def_count] = new defEntry(111,"Maxine of G",'maxine'," is the order of the largest independent set that one gets from the greedy algorithm that proceeds by removing a vertex of maximum degree until the subgraph is discrete."); def_count = def_count+1;

allEntries2[def_count] = new defEntry(112,"Number of edges of G between S and T",'|E(S,T)|'," is the number of edges of G with one endpoint in S and the other in T."); def_count = def_count+1;

allEntries2[def_count] = new defEntry(113,"Welsh-Powell of the complement of G",'WP(<span style="text-decoration: overline">G</span>)'," is the largest k such that the k + d<sub>k</sub> is less than or equal to n, where the degree sequence is order in nondecreasing order, that is d<sub>1</sub> <= d<sub>2</sub> <= ... d<sub>n</sub> ."); def_count = def_count+1;

allEntries2[def_count] = new defEntry(114,"disparity of a vertex ",'disp(v)'," is the number of distinct degrees that occur among it neighbors. This is computed for each vertex. Then the maximum, minimum and average are computed over all and denoted, disp<sub>max</sub>, disp<sub>min</sub> and disp<sub>avg</sub>, respectively "); def_count = def_count+1;

allEntries2[def_count] = new defEntry(115,"Number of isolates of G",'isolates(G)'," is the number of vertices of G of degree zero."); def_count = def_count+1;

allEntries2[def_count] = new defEntry(116,"Number of private external neighbors of S",'peN(S)'," is the number of vertices of V(G)\\S that have exactly one nieghbor in S."); def_count = def_count+1;

allEntries2[def_count] = new defEntry(117,"A component of a graph is a maximal connected subgraph",'c(G)'," is the number of components of G and c<sub>L</sub>(G) is the <b>order of a largest component</b> of G."); def_count = def_count+1;

allEntries2[def_count] = new defEntry(118,"k-independence number",'<font face="Symbol">a<sub>k</sub></font>',"A subset of the vertices, D<sub>k</sub>, of the graph is called a <i>k-independent set</i> of the graph if the subgraph induced by D<sub>k</sub> has maximum degree at most k-1. The <i>k-independence number of a graph</i> is the order of a largest k-independent set of the graph."); def_count = def_count+1;

allEntries2[def_count] = new defEntry(119,"Szekeres-Wilf invariant ",'SW(G)',"the maximum of minimum degrees over all subgraphs of G."); def_count = def_count+1;

allEntries2[def_count] = new defEntry(120,"neighbor dominator ",' '," vertex v (neighbor) dominates u if N[u] is contained in N[v]"); def_count = def_count+1;

allEntries2[def_count] = new defEntry(121,"Caro-Wei invariant ",'CW(G)',"the sum of the reciprocals of one plus the degrees."); def_count = def_count+1;

allEntries2[def_count] = new defEntry(122,"Number of private neighbors of S",'pN(S)'," is the number of vertices of V(G) that have exactly one nieghbor in S."); def_count = def_count+1;

}



function printDefinitions(def1,def2,def3,def4,def5)
{


initialize2();

parent.rbottom.document.write('<html><head><meta http-equiv="Content-Type" content="text/html; charset=windows-1252"></head><body>');
if (def1 != 0 )
{	
	parent.rbottom.document.write("<i>");
	parent.rbottom.document.write(allEntries2[def1].notation);
	parent.rbottom.document.write("</i>");
	parent.rbottom.document.write(":");
	parent.rbottom.document.write("&nbsp;");
	parent.rbottom.document.write("&nbsp;");
	parent.rbottom.document.write("<b>");
	parent.rbottom.document.write(allEntries2[def1].term);
	parent.rbottom.document.write("</b>");
	parent.rbottom.document.write(":");
	parent.rbottom.document.write("&nbsp;");
	parent.rbottom.document.write(allEntries2[def1].statement);
	parent.rbottom.document.write("<p>");
}
if (def2 != 0 )
{	
	parent.rbottom.document.write("<i>");
	parent.rbottom.document.write(allEntries2[def2].notation);
	parent.rbottom.document.write("</i>");
	parent.rbottom.document.write(":");
	parent.rbottom.document.write("&nbsp;");
	parent.rbottom.document.write("&nbsp;");
	parent.rbottom.document.write("<b>");
	parent.rbottom.document.write(allEntries2[def2].term);
	parent.rbottom.document.write("</b>");
	parent.rbottom.document.write(":");
	parent.rbottom.document.write("&nbsp;");
	parent.rbottom.document.write(allEntries2[def2].statement);
	parent.rbottom.document.write("<p>");
}
if (def3 != 0 )
{	
	parent.rbottom.document.write("<i>");
	parent.rbottom.document.write(allEntries2[def3].notation);
	parent.rbottom.document.write("</i>");
	parent.rbottom.document.write(":");
	parent.rbottom.document.write("&nbsp;");
	parent.rbottom.document.write("&nbsp;");
	parent.rbottom.document.write("<b>");
	parent.rbottom.document.write(allEntries2[def3].term);
	parent.rbottom.document.write("</b>");
	parent.rbottom.document.write(":");
	parent.rbottom.document.write("&nbsp;");
	parent.rbottom.document.write(allEntries2[def3].statement);
	parent.rbottom.document.write("<p>");
}
if (def4 != 0 )
{	
	parent.rbottom.document.write("<i>");
	parent.rbottom.document.write(allEntries2[def4].notation);
	parent.rbottom.document.write("</i>");
	parent.rbottom.document.write(":");
	parent.rbottom.document.write("&nbsp;");
	parent.rbottom.document.write("&nbsp;");
	parent.rbottom.document.write("<b>");
	parent.rbottom.document.write(allEntries2[def4].term);
	parent.rbottom.document.write("</b>");
	parent.rbottom.document.write(":");
	parent.rbottom.document.write("&nbsp;");
	parent.rbottom.document.write(allEntries2[def4].statement);
	parent.rbottom.document.write("<p>");
}
if (def5 != 0 )
{	
	parent.rbottom.document.write("<i>");
	parent.rbottom.document.write(allEntries2[def5].notation);
	parent.rbottom.document.write("</i>");
	parent.rbottom.document.write(":");
	parent.rbottom.document.write("&nbsp;");
	parent.rbottom.document.write("&nbsp;");
	parent.rbottom.document.write("<b>");
	parent.rbottom.document.write(allEntries2[def5].term);
	parent.rbottom.document.write("</b>");
	parent.rbottom.document.write(":");
	parent.rbottom.document.write("&nbsp;");
	parent.rbottom.document.write(allEntries2[def5].statement);
	parent.rbottom.document.write("<p>");
}
  parent.rbottom.document.write('</body>');
  parent.rbottom.document.write('</html>');
	parent.rbottom.document.close();

}

function printAllDefinitions(numdefs)
{
initialize2();
parent.rtop.document.write('<html><head><meta http-equiv="Content-Type" content="text/html; charset=windows-1252"></head><body>');

for (var count = 1; count < numdefs+1; count++)
  {
	parent.rtop.document.write("<i>");
	parent.rtop.document.write(allEntries2[count].notation);
	parent.rtop.document.write("</i>");
	parent.rtop.document.write(":");
	parent.rtop.document.write("&nbsp;");
	parent.rtop.document.write("&nbsp;");
	parent.rtop.document.write("<b>");
	parent.rtop.document.write(allEntries2[count].term);
	parent.rtop.document.write("</b>");
	parent.rtop.document.write(":");
	parent.rtop.document.write("&nbsp;");
	parent.rtop.document.write(allEntries2[count].statement);
	parent.rtop.document.write("<p>");
      
  }

  parent.rtop.document.write('</body>');
  parent.rtop.document.write('</html>');
	parent.rtop.document.close();

}

