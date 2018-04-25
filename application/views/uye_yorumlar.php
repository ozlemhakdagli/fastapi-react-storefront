

	<section>
		
			<div class="row">
				
				<div class="col-sm-7">
					<div class="blog-post-area">
						<h2 class="title text-center">Yapılan Yorumlar</h2>
						<div class="single-blog-post">
							
							
									              <table class="table table-hover" border="1">
			  <thead>
                <tr>
                  
                  <th bgcolor="#ff9933">Sıra No</th>
                  <th bgcolor="#ff9933">Yorum</th>
				  <th bgcolor="#ff9933">Ürün Adı</th>
				  <th bgcolor="#ff9933">Tarih</th>
				  <th bgcolor="#ff9933">İşlemler</th>
                </tr>
				</thead>
				<tbody>
                <?php
				$i=0;
				
				foreach($yorumlar as $rs)
				{	
                ?>
				
				
				<tr>
                  
                  <td><?=++$i?></td>
                  <td><?=$rs->yorum?></td>
				  <td><?=$rs->urun_id?></td>
				  <td><?=$rs->tarih?></td>
				  
				 
				 
				 
				 <td>
                   
					<a href ="<?=base_url() ?>home/yorum_detay/<?=$rs->Id?>" ><button type="button" class="btn btn-info">Detay</button></a>
                    <a href ="<?=base_url() ?>home/yorumsil/<?=$rs->Id?>" ><button type="button" class="btn btn-danger">Sil</button></a>
                    </div>
                  </td>
				  
                </tr>
				
				
				
				
				
				 <?php
				}
                ?>
				</tbody>
                
                
              </table>


				
				
			
	


	
						</div>
					</div><!--/blog-post-area-->

				

					
					
				</div>	
			</div>
		
	</section>
	

  

</body>
</html>