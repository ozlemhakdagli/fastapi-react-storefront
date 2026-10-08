

	<section>
		
		
				
				<div class="col-sm-9">
					<div class="blog-post-area">
						<h2 class="title text-center">Sipariş Detayı</h2>
						<div class="single-blog-post">
							
				 <table class="table table-hover" border="1">
			  <thead>
                <tr><th bgcolor="#ff9933">Adı Soyadı:</th><td><?=$siparis[0]->adsoy?></td></tr>              
                <tr><th bgcolor="#ff9933">Adres:</th><td><?=$siparis[0]->adres?></td></tr>
                <tr><th bgcolor="#ff9933">Telefon:</th><td><?=$siparis[0]->tel?></td></tr>
				<tr><th bgcolor="#ff9933">Şehir:</th><td><?=$siparis[0]->sehir?></td></tr>
                <tr> <th bgcolor="#ff9933">Kargo Firma</th><td><?=$siparis[0]->kargofirma?></td></tr>
				<tr><th bgcolor="#ff9933">Kargo No:</th><td><?=$siparis[0]->kargono?></td></tr>
               
                
				</thead>
				
                
                
              </table>
<h3> Siparişe Ait Ürünler</h3>

				  <table class="table table-hover" border="1">
			  <thead>
                <tr>
                  
                  <th bgcolor="#ff9933">Sıra No</th>
                  <th bgcolor="#ff9933">Ürün Adı</th>
				  <th bgcolor="#ff9933">Miktar</th>
				  <th bgcolor="#ff9933">Birim Fiyat</th>
			      <th bgcolor="#ff9933">Tutar</th>
				 
                </tr>
				</thead>
				<tbody>
                <?php
				$i=0;
				
				foreach($urunler as $rs)
				{	
					
                ?>
				
				
				<tr>
                  
                  <td><?=++$i?></td>
                  <td><?=$rs->adi?></td>
				  <td><?=$rs->miktar?></td>
				  <td><?=$rs->fiyat?></td>
				  <td><?=$rs->tutar?></td>
				 
				 
				 
				 
				 
				  
                </tr>
				
				
				
				
				
				 <?php
				}
                ?>
				</tbody>
                
                
              </table>
				
			
	


	
						</div>
					</div><!--/blog-post-area-->

				

					
					
				</div>	
			
		
	</section>
	

  

</body>
</html>