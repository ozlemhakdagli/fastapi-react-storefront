

	<section>
		
			<div class="row">
				
				<div class="col-sm-7">
					<div class="blog-post-area"><?php if ($this->session->flashdata('sonuc')) 
			  { ?>
			  <div >
                <h3><?=$this->session->flashdata('sonuc')?></h3>
								<?php } ?>
						<h2 class="title text-center">Gelen Mesajlar</h2>
						<div class="single-blog-post">
							
							
									              <table class="table table-hover" border="1">
			  <thead>
                <tr>
                  
                  <th bgcolor="#ff9933">Sıra No</th>
                  <th bgcolor="#ff9933">Mesaj</th>
				  <th bgcolor="#ff9933">Konu</th>
				  <th bgcolor="#ff9933">Tarih</th>
				  <th bgcolor="#ff9933">İşlemler</th>
                </tr>
				</thead>
				<tbody>
                <?php
				$i=0;
				
				foreach($mesajlar as $rs)
				{	
                ?>
				
				
				<tr>
                  
                  <td><?=++$i?></td>
				  <td><?=$rs->konu?></td>
                  <td><?=$rs->mesaj?></td>
				  <td><?=$rs->tarih?></td>
				  
				  <td>
                   
                    <a href ="<?=base_url() ?>home/g_mesajsil/<?=$rs->Id?>" ><button type="button" class="btn btn-danger">Sil</button></a>
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