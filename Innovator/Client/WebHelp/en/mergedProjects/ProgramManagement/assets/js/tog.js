function tog(id){
		    var i = document.getElementById(id);
			if(i.style.display==='none')
			 {var x= i.style.display='inline';}
			else
			{var x= i.style.display='none';};
		}
		function showall(){
		    var a = document.all;
		    for (var i=0; i<a.length;i++)
		    {
		      if ( a(i).id.substr(0,3)==='tog')
		      {
		       a(i).style.display='inline';
		      }
		    }
		}
		function hideall(){
		    var a = document.all;
		    for (var i=0; i<a.length;i++)
		    {
		      if ( a(i).id.substr(0,3)==='tog')
		      {
		       a(i).style.display='none';
		      }
		    }
		}
